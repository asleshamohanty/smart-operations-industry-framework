# Circular Resource Exchange Feature

## Overview

The Circular Resource Exchange feature is an intelligent system that automatically suggests alternate materials from other projects when shipments are delayed. This promotes circular economy principles by reusing surplus materials to minimize waste, reduce carbon emissions, and maintain project timelines.

## Key Features

### 1. **Intelligent Material Matching**
- Automatically identifies delayed materials and finds matching alternatives
- Matches materials by type and unit (e.g., Steel in tonnes, Cement in bags)
- Excludes materials from the same project to prevent circular dependencies

### 2. **Advanced Feasibility Scoring**
The system calculates a composite feasibility score (0-1, higher is better) based on:

- **Distance (30% weight)**: Closer projects get higher priority
- **CO₂ Emissions (20% weight)**: Lower transport emissions are preferred
- **Expiry Urgency (30% weight)**: Materials nearing expiry get maximum priority
- **Quantity Adequacy (20% weight)**: Sufficient quantity for project needs

### 3. **Sustainability-Focused Recommendations**
- Prioritizes materials with expiry dates within 30 days
- Calculates CO₂ emissions for transport
- Provides clear reasoning for each recommendation

### 4. **Smart Recommendation Messages**
- `"Recommended because material is nearing expiry; reuse prevents waste."` - For urgent expiry
- `"Recommended due to better distance and emission efficiency."` - For efficiency

## API Endpoints

### Core Endpoints

#### `POST /circular-exchange/recommendations`
Get circular exchange recommendations for a delayed material.

**Request Body:**
```json
{
  "material_name": "Steel",
  "project_id": 1,
  "required_quantity": 50.0,
  "required_unit": "tonnes"
}
```

**Response:**
```json
{
  "delayed_material": "Steel",
  "delayed_project_id": 1,
  "delayed_project_name": "Highway Project",
  "alternatives": [
    {
      "project_id": 2,
      "project_name": "Bridge Project",
      "material_name": "Steel",
      "quantity_available": 80.0,
      "unit": "tonnes",
      "distance_km": 150.0,
      "expiry_date": "2024-06-15T00:00:00",
      "feasibility_score": 0.564,
      "recommendation_message": "Recommended due to better distance and emission efficiency.",
      "co2_emissions_kg": 2400.0,
      "days_until_expiry": 304
    }
  ],
  "total_alternatives_found": 1,
  "recommendation_summary": "Found 1 potential alternatives for Steel. Top 1 recommendations prioritize sustainability and efficiency.",
  "generated_at": "2024-01-15T10:30:00"
}
```

#### `POST /circular-exchange/delay-notification`
Handle automatic delay notifications and provide recommendations.

#### `GET /circular-exchange/available-materials`
Get all materials available for circular exchange.

#### `GET /circular-exchange/sustainability-metrics`
Get sustainability metrics for circular exchange activities.

### Shipments Integration

#### `GET /shipments/{shipment_id}/circular-exchange-recommendations`
Get circular exchange recommendations for a specific delayed shipment.

## Integration with Existing System

### 1. **Automatic Triggering**
- Integrated with shipment generation in `routers/shipments.py`
- Automatically generates recommendations when shipments are delayed
- Recommendations are included in shipment data

### 2. **Database Integration**
- Uses existing Supabase database
- Leverages `projects` and `materials` tables
- Maintains data consistency with existing system

### 3. **Weather Integration**
- Works alongside existing weather delay prediction
- Considers weather-related delays when suggesting alternatives
- Maintains weather impact analysis

## Technical Implementation

### Core Service: `CircularResourceExchangeService`

**Location:** `backend/utils/circular_exchange_service.py`

**Key Methods:**
- `find_alternate_materials()` - Main recommendation engine
- `_calculate_feasibility_score()` - Composite scoring algorithm
- `_calculate_distance()` - Distance calculation between locations
- `_calculate_co2_emissions()` - CO₂ emissions calculation
- `_get_recommendation_message()` - Smart recommendation messages

### API Router: `circular_exchange`

**Location:** `backend/routers/circular_exchange.py`

**Features:**
- RESTful API endpoints
- Comprehensive error handling
- Pydantic models for request/response validation
- Integration with existing database system

### Distance Calculation

The system uses a simplified distance matrix for major Indian cities:
- Mumbai ↔ Pune: 150 km
- Mumbai ↔ Delhi: 1400 km
- Mumbai ↔ Bangalore: 850 km
- And more...

*Note: In production, this would use geocoding APIs for accurate distances.*

### Material Expiry Logic

Different materials have different shelf lives:
- **Cement/Concrete**: 90 days
- **Steel/Metal**: 365 days
- **Paint/Coating**: 730 days
- **Wood/Timber**: 1825 days
- **Default**: 180 days

## Usage Examples

### 1. **Basic Recommendation Request**
```python
from utils.circular_exchange_service import CircularResourceExchangeService

service = CircularResourceExchangeService()
recommendation = service.find_alternate_materials(
    delayed_material="Steel",
    delayed_project_id=1,
    required_quantity=50.0,
    required_unit="tonnes",
    delayed_project_location="Mumbai, Maharashtra, India"
)
```

### 2. **API Call Example**
```bash
curl -X POST "http://localhost:8000/circular-exchange/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "material_name": "Steel",
    "project_id": 1,
    "required_quantity": 50.0,
    "required_unit": "tonnes"
  }'
```

### 3. **Frontend Integration**
```typescript
// Get recommendations for a delayed shipment
const response = await api.post('/circular-exchange/recommendations', {
  material_name: 'Steel',
  project_id: projectId,
  required_quantity: 50.0,
  required_unit: 'tonnes'
});

const alternatives = response.data.alternatives;
```

## Benefits

### 1. **Waste Reduction**
- Prevents materials from expiring unused
- Promotes reuse of surplus materials
- Reduces overall material waste

### 2. **Carbon Footprint Reduction**
- Minimizes transport distances
- Reduces CO₂ emissions from material production
- Promotes sustainable resource utilization

### 3. **Project Timeline Maintenance**
- Provides immediate alternatives for delayed materials
- Reduces project delays
- Maintains construction schedules

### 4. **Cost Optimization**
- Reduces need for emergency material purchases
- Optimizes resource allocation across projects
- Improves overall project economics

## Configuration

### Environment Variables
- Uses existing Supabase configuration
- No additional environment variables required

### Customization Options
```python
# In CircularResourceExchangeService.__init__()
self.base_co2_per_km_kg = 0.2  # CO2 emissions per km per kg
self.max_distance_km = 500     # Maximum distance for consideration
self.expiry_threshold_days = 30 # Days before expiry to trigger urgent recommendation
```

## Testing

The feature has been thoroughly tested with:
- ✅ Material matching algorithm
- ✅ Feasibility scoring system
- ✅ Distance calculations
- ✅ CO₂ emissions calculations
- ✅ Expiry date handling
- ✅ Database integration
- ✅ API endpoints
- ✅ Error handling

## Future Enhancements

1. **Real-time Distance APIs**: Integration with Google Maps or similar services
2. **Machine Learning**: Predictive material demand and availability
3. **Blockchain Integration**: Transparent material tracking and exchange
4. **Mobile App**: Real-time notifications for material exchanges
5. **Advanced Analytics**: Detailed sustainability impact reporting

## Support

For questions or issues with the Circular Resource Exchange feature:
1. Check the API documentation at `/docs`
2. Review the test cases in the codebase
3. Contact the development team

---

*This feature aligns with circular economy principles and ESG goals, promoting sustainable construction practices while maintaining operational efficiency.*
