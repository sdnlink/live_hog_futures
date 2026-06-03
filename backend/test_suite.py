import pytest
import datetime
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.main import app, get_db
from backend.yijing import generate_yijing_forecast
from backend.models import (
    FuturesQuote, SpotPrice, BreedingIndicator, SwineCapacity,
    SentimentIndex, EpidemicReport, BiopharmaceuticalProcurement,
    BreedingConsumableConsumption, FeedSalesBreakdown, HogLogisticsAndSafety
)

# 1. Test Yijing Forecast Logic
def test_yijing_forecast_logic():
    # Pass normal baseline values
    res = generate_yijing_forecast(
        spot_price=15.4,
        futures_price=13500.0,
        pig_to_grain=5.8,
        self_profit=-100.0,
        corn_price=2420.0
    )
    
    # Assert top-level structure
    assert "timestamp" in res
    assert res["spot_price"] == 15.4
    assert res["futures_price"] == 13500.0
    assert "meihua" in res
    assert "liuyao" in res
    assert "forecast" in res
    assert "interpretation" in res
    assert "direction" in res
    assert "direction_class" in res
    assert "confidence" in res
    
    # Check meihua details
    assert "ben_gua" in res["meihua"]
    assert "upper" in res["meihua"]
    assert "score" in res["meihua"]
    
    # Check liuyao details
    assert "ben_gua" in res["liuyao"]
    assert "yao_render" in res["liuyao"]
    assert len(res["liuyao"]["yao_render"]) == 6
    
    # Check forecast timeframes
    assert "realtime" in res["forecast"]
    assert "day1" in res["forecast"]
    assert "day5" in res["forecast"]
    assert "day10" in res["forecast"]
    
    # Check day5 price limits
    assert res["forecast"]["day5"]["high"] >= res["forecast"]["day5"]["mid"]
    assert res["forecast"]["day5"]["low"] <= res["forecast"]["day5"]["mid"]


# 2. Test Expert Advice Scenarios
class MockQuery:
    def __init__(self, model_class, return_val=None):
        self.model_class = model_class
        self.return_val = return_val or []
        self._filter_val = None
        self._offset_val = 0

    def order_by(self, *args):
        return self

    def limit(self, *args):
        return self

    def offset(self, val):
        self._offset_val = val
        return self

    def desc(self):
        return self

    def asc(self):
        return self

    def filter(self, *args):
        return self

    def first(self):
        if isinstance(self.return_val, list):
            idx = self._offset_val
            return self.return_val[idx] if idx < len(self.return_val) else None
        return self.return_val

    def all(self):
        if not isinstance(self.return_val, list):
            return [self.return_val] if self.return_val else []
        return self.return_val

    def scalar(self):
        return 500.0 # simple fallback for func.avg calls



def test_expert_advice_epidemic_scenario():
    # Setup mock DB session
    mock_db = MagicMock()
    
    # Mock return values for Scenario A: Epidemic outbreak
    # mortality_waste_disposal is high (e.g. 800.0, avg is 500.0), sentiment score for 非瘟 is high
    today = datetime.date.today()
    mock_spots = [SpotPrice(date=today, price=16.2), SpotPrice(date=today - datetime.timedelta(days=1), price=16.3)]
    mock_quote = FuturesQuote(symbol="LH0", last_price=15000.0)
    mock_indicator = BreedingIndicator(date=today, pig_to_grain_ratio=6.2, self_breeding_profit=50.0, piglet_breeding_profit=-50.0)
    mock_capacity = SwineCapacity(date=today, pork_production=400.0, hog_slaughter=3.0) # avg weight = 400 * 1000 / 3 / 0.75 = 177 kg
    mock_sentiments = [
        SentimentIndex(date=today, keyword="非洲猪瘟", sentiment_score=45.0, frequency=20),
        SentimentIndex(date=today, keyword="流行性腹泻", sentiment_score=10.0, frequency=5)
    ]
    mock_biopharm = BiopharmaceuticalProcurement(date=today, altrenogest_sales=90.0)
    mock_consumables = BreedingConsumableConsumption(date=today, insemination_catheters=260.0)
    mock_feed = FeedSalesBreakdown(date=today, finisher_feed=40.0, overall_feed_volume=100.0) # finisher ratio = 40% (normal)
    mock_logistics = HogLogisticsAndSafety(date=today, mortality_waste_disposal=850.0)
    mock_epidemic = [EpidemicReport(date=today, title="非瘟警报", level="danger", source="农业农村部")] # High mortality (850 > 500 * 1.3)
    
    def side_effect(model_class):
        if model_class is SpotPrice:
            return MockQuery(SpotPrice, mock_spots)
        elif model_class is FuturesQuote:
            return MockQuery(FuturesQuote, mock_quote)
        elif model_class is BreedingIndicator:
            return MockQuery(BreedingIndicator, mock_indicator)
        elif model_class is SwineCapacity:
            return MockQuery(SwineCapacity, mock_capacity)
        elif model_class is SentimentIndex:
            return MockQuery(SentimentIndex, mock_sentiments)
        elif model_class is BiopharmaceuticalProcurement:
            return MockQuery(BiopharmaceuticalProcurement, mock_biopharm)
        elif model_class is BreedingConsumableConsumption:
            return MockQuery(BreedingConsumableConsumption, mock_consumables)
        elif model_class is FeedSalesBreakdown:
            return MockQuery(FeedSalesBreakdown, mock_feed)
        elif model_class is HogLogisticsAndSafety:
            return MockQuery(HogLogisticsAndSafety, mock_logistics)
        elif model_class is EpidemicReport:
            return MockQuery(EpidemicReport, mock_epidemic)
        return MockQuery(model_class)

    mock_db.query.side_effect = side_effect
    
    # Import locally to test expert advice function
    from backend.main import get_expert_advice
    res = get_expert_advice(symbol="LH0", db=mock_db)
    
    assert res["status"] == "success"
    assert "疫情变动确认" in res["conclusion"]["title"]
    assert res["warning_level"] == "danger"


def test_expert_advice_feed_squeeze_scenario():
    # Setup mock DB session
    mock_db = MagicMock()
    
    # Scenario B: High Feed Raw Material Cost (corn_price > 2600, self_profit < 0)
    today = datetime.date.today()
    mock_spots = [SpotPrice(date=today, price=15.0)]
    mock_quote = FuturesQuote(symbol="LH0", last_price=14500.0)
    # High corn price 2750, mild loss to trigger cost squeeze instead of bottoming out
    mock_indicator = BreedingIndicator(date=today, pig_to_grain_ratio=5.9, self_breeding_profit=-50.0, piglet_breeding_profit=-150.0, corn_price=2750.0)
    mock_capacity = SwineCapacity(date=today, pork_production=300.0, hog_slaughter=2.5) # normal avg weight
    mock_sentiments = []
    mock_biopharm = BiopharmaceuticalProcurement(date=today, altrenogest_sales=500.0)
    mock_consumables = BreedingConsumableConsumption(date=today, insemination_catheters=500.0)
    mock_feed = FeedSalesBreakdown(date=today, finisher_feed=40.0, overall_feed_volume=100.0)
    mock_logistics = HogLogisticsAndSafety(date=today, mortality_waste_disposal=450.0) # normal mortality
    
    def side_effect(model_class):
        if model_class is SpotPrice:
            return MockQuery(SpotPrice, mock_spots)
        elif model_class is FuturesQuote:
            return MockQuery(FuturesQuote, mock_quote)
        elif model_class is BreedingIndicator:
            return MockQuery(BreedingIndicator, mock_indicator)
        elif model_class is SwineCapacity:
            return MockQuery(SwineCapacity, mock_capacity)
        elif model_class is SentimentIndex:
            return MockQuery(SentimentIndex, mock_sentiments)
        elif model_class is BiopharmaceuticalProcurement:
            return MockQuery(BiopharmaceuticalProcurement, mock_biopharm)
        elif model_class is BreedingConsumableConsumption:
            return MockQuery(BreedingConsumableConsumption, mock_consumables)
        elif model_class is FeedSalesBreakdown:
            return MockQuery(FeedSalesBreakdown, mock_feed)
        elif model_class is HogLogisticsAndSafety:
            return MockQuery(HogLogisticsAndSafety, mock_logistics)
        return MockQuery(model_class)

    mock_db.query.side_effect = side_effect
    
    from backend.main import get_expert_advice
    res = get_expert_advice(symbol="LH0", db=mock_db)
    
    assert res["status"] == "success"
    assert "高成本挤压" in res["conclusion"]["title"]
    assert res["warning_level"] == "warning"


# 3. Test API Endpoints using FastAPI TestClient
client = TestClient(app)

def test_api_realtime_futures():
    # Setup override DB mock
    mock_db = MagicMock()
    today = datetime.date.today()
    mock_quote = FuturesQuote(
        id=1, symbol="LH2609", name="生猪2609", open=15000.0, high=15200.0, low=14900.0,
        last_price=15100.0, yesterday_close=14950.0, yesterday_settle=14980.0,
        bid=15090.0, ask=15110.0, volume=5000.0, open_interest=20000.0, settlement=15100.0,
        date=today, time="15:00:00", updated_at=datetime.datetime.now()
    )
    
    mock_db.query().order_by().all.return_value = [mock_quote]
    app.dependency_overrides[get_db] = lambda: mock_db
    
    response = client.get("/api/futures/realtime")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["symbol"] == "LH2609"
    assert data[0]["last_price"] == 15100.0


def test_api_epidemic_status():
    mock_db = MagicMock()
    today = datetime.date.today()
    mock_report = EpidemicReport(
        id=1, date=today, title="非瘟疫情通报", content="散发疫情已处置",
        source="农业部", level="warning", url="http://test.com"
    )
    mock_sentiment = SentimentIndex(
        id=1, date=today, keyword="非瘟", frequency=10, sentiment_score=25.5
    )
    
    # Mock two different query calls in epidemic endpoint
    # First call: EpidemicReport queries. Second call: SentimentIndex queries.
    mock_db.query.side_effect = [
        MockQuery(EpidemicReport, [mock_report]),
        MockQuery(SentimentIndex, mock_sentiment),
        MockQuery(SentimentIndex, [mock_sentiment])
    ]
    app.dependency_overrides[get_db] = lambda: mock_db
    
    response = client.get("/api/epidemic/status")
    assert response.status_code == 200
    data = response.json()
    assert "reports" in data
    assert "sentiment" in data
    assert len(data["reports"]) == 1
    assert data["reports"][0]["title"] == "非瘟疫情通报"
    assert len(data["sentiment"]) == 1
    assert data["sentiment"][0]["keyword"] == "非瘟"


def test_api_yijing_forecast():
    mock_db = MagicMock()
    today = datetime.date.today()
    
    # We will mock the database queries called during yijing forecast
    # Mocking SpotPrice, FuturesQuote, BreedingIndicator, and YijingForecastRecord check
    mock_db.query().filter().first.return_value = None # No existing today record cached
    
    mock_spot = SpotPrice(id=1, date=today, price=15.4)
    mock_quote = FuturesQuote(id=1, symbol="LH0", last_price=13500.0)
    mock_indicator = BreedingIndicator(id=1, date=today, pig_to_grain_ratio=5.8, self_breeding_profit=-100.0, corn_price=2420.0)
    
    def side_effect(model_class):
        if model_class is SpotPrice:
            return MockQuery(SpotPrice, mock_spot)
        elif model_class is FuturesQuote:
            return MockQuery(FuturesQuote, mock_quote)
        elif model_class is BreedingIndicator:
            return MockQuery(BreedingIndicator, mock_indicator)
        return MockQuery(model_class)
        
    mock_db.query.side_effect = side_effect
    app.dependency_overrides[get_db] = lambda: mock_db
    
    response = client.get("/api/yijing/forecast", params={"symbol": "LH0"})
    assert response.status_code == 200
    data = response.json()
    assert "timestamp" in data
    assert "direction" in data
    assert "forecast" in data
    
    # Clean overrides
    app.dependency_overrides.clear()


def test_api_comprehensive_analysis_report():
    mock_db = MagicMock()
    today = datetime.date.today()
    
    # Mock return values for all required models in the endpoint
    mock_spot = SpotPrice(id=1, date=today, price=15.8)
    mock_quote = FuturesQuote(id=1, symbol="LH0", last_price=14500.0)
    mock_indicator = BreedingIndicator(id=1, date=today, pig_to_grain_ratio=5.9, self_breeding_profit=-80.0, piglet_breeding_profit=-150.0, corn_price=2450.0)
    mock_capacity = SwineCapacity(id=1, date=today, maternal_sow_inventory=42.0, pork_production=410.0, hog_slaughter=3.1)
    mock_feed = FeedSalesBreakdown(id=1, date=today, finisher_feed=45.0, overall_feed_volume=100.0)
    mock_logistics = HogLogisticsAndSafety(id=1, date=today, mortality_waste_disposal=480.0)
    mock_consumables = BreedingConsumableConsumption(id=1, date=today, insemination_catheters=255.0)
    mock_sentiment = SentimentIndex(id=1, date=today, keyword="抖音#生猪价格 涨跌比", sentiment_score=62.0)
    
    def side_effect(model_class):
        if model_class is SpotPrice:
            return MockQuery(SpotPrice, mock_spot)
        elif model_class is FuturesQuote:
            return MockQuery(FuturesQuote, mock_quote)
        elif model_class is BreedingIndicator:
            return MockQuery(BreedingIndicator, mock_indicator)
        elif model_class is SwineCapacity:
            return MockQuery(SwineCapacity, [mock_capacity, mock_capacity])
        elif model_class is FeedSalesBreakdown:
            return MockQuery(FeedSalesBreakdown, mock_feed)
        elif model_class is HogLogisticsAndSafety:
            return MockQuery(HogLogisticsAndSafety, mock_logistics)
        elif model_class is BreedingConsumableConsumption:
            return MockQuery(BreedingConsumableConsumption, [mock_consumables, mock_consumables])
        elif model_class is SentimentIndex:
            return MockQuery(SentimentIndex, mock_sentiment)
        return MockQuery(model_class)
        
    mock_db.query.side_effect = side_effect
    app.dependency_overrides[get_db] = lambda: mock_db
    
    response = client.get("/api/analysis/report")
    assert response.status_code == 200
    data = response.json()
    
    # Assert top-level structure
    assert "summary" in data
    assert "dimensions" in data
    assert "swot" in data
    assert "narrative" in data
    
    # Verify summary fields
    assert "market_phase" in data["summary"]
    assert "composite_index" in data["summary"]
    assert "composite_status" in data["summary"]
    assert "risk_level" in data["summary"]
    
    # Verify dimensions
    dimensions = data["dimensions"]
    for dim in ["supply", "demand", "profit", "speculation", "sentiment", "disease"]:
        assert dim in dimensions
        assert "score" in dimensions[dim]
        assert "status" in dimensions[dim]
        assert "desc" in dimensions[dim]
        
    # Verify swot fields
    assert "strengths" in data["swot"]
    assert "weaknesses" in data["swot"]
    assert "opportunities" in data["swot"]
    assert "threats" in data["swot"]
    
    app.dependency_overrides.clear()

