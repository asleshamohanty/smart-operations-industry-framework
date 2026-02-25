# 3D Building Model Layout

## Building Structure

```
         [Roof - Floor 3]
         Antenna (Comms)     Weather Sensors
              |                  🟢🟢🟢
         ┌────┴────┐         (Temp, Rain, Wind)
         │  Floor 3 │ - SDG Compliance 🟢
         │  9x9x2   │
         └──────────┘
         
         ┌──────────┐
         │  Floor 2 │ - ESG Sensors 🟢🟢🟢
         │ 10x10x2  │   (Environmental, Social, Governance)
         └──────────┘
         
         ┌──────────┐
         │  Floor 1 │ - Core Operations
         │ 11x11x2  │   Windows, Door
         └──────────┘
         
    ══════════════════
        Ground Floor
    ══════════════════
```

## Sensor Placement

### Rooftop (Weather Monitoring) - y: 7.5
- **Temperature Sensor** 🌡️ at (-3, 7.5, -3)
- **Rainfall Gauge** 🌧️ at (3, 7.5, -3)
- **Wind Anemometer** 💨 at (-3, 7.5, 3)
- **Weather Impact** ⛈️ at (0, 7.5, 0)

### Floor 3 (Compliance) - y: 5.5
- **SDG Compliance Monitor** ✅ at (0, 5.5, 4)

### Floor 2 (ESG Monitoring) - y: 3.5
- **Environmental Impact** 🌿 at (-4, 3.5, 0)
- **Social Impact** 👥 at (4, 3.5, 0)
- **Governance Impact** 📋 at (0, 3.5, -4)

### External Facilities (Ground Level)

#### Generator Shed - (-10, 1, -10)
- **Carbon Footprint Tracker** 💨 nearby

#### Water Tank - (10, 1.5, -10)
- **Water Usage Meter** 💧 nearby

#### Solar Panels - (-10, 2.5, 10)
- **Energy Consumption** ⚡ nearby

### Performance Indicators (Floating Around Building) - y: 4
- **Schedule Delay** ⏱️ at (0, 4, 7) - South
- **Cost Overrun** 💰 at (7, 4, 0) - East
- **ESG Performance** 📊 at (0, 4, -7) - North
- **Profitability Impact** 💹 at (-7, 4, 0) - West

## Visual Features

### Building Elements
- **3 Floors** - Stepped design (larger at bottom)
- **Blue Windows** - Glowing windows on each floor
- **Dark Gray** - Realistic building materials
- **Antenna** - Red light on rooftop (northwest corner)
- **Chimney/Vent** - Southeast corner of roof

### Surrounding Structures
- **Generator Shed** - Gray box (southwest)
- **Water Tank** - Blue transparent cylinder (southeast)
- **Solar Panels** - Blue reflective panel (northwest)
- **Ground Platform** - Dark base (30x30)

### Sensor Visual States
- **🟢 Green Sphere** - Normal operation
- **🔴 Red Pulsating** - Anomaly detected
- **Size Variation** - Bigger = Higher severity
- **Dotted Lines** - Connections between related sensors
- **Labels** - Sensor names above spheres
- **Tooltips** - Detailed info on hover

## Camera Controls
- **Drag** - Rotate view
- **Scroll** - Zoom in/out
- **Initial View** - 45° angle from above (25, 12, 25)
- **Limits** - Min distance: 5, Max distance: 50

## Interaction
- **Hover** - Show sensor details tooltip
- **Click Normal Sensor** - Inspect (future feature)
- **Click Anomalous Sensor** - Navigate to anomaly details page
- **Real-time Updates** - Sensors update every 5-10 seconds

The building provides spatial context for sensor placement and makes the digital twin feel like an actual infrastructure facility!

