// Construction materials list for dropdown
export const CONSTRUCTION_MATERIALS = [
  // Structural Materials
  "Steel",
  "Reinforced Steel",
  "Stainless Steel",
  "Aluminum",
  "Iron",
  "Concrete",
  "Reinforced Concrete",
  "Precast Concrete",
  "Ready Mix Concrete",
  
  // Masonry Materials
  "Brick",
  "Clay Brick",
  "Concrete Block",
  "Cement Block",
  "Stone",
  "Granite",
  "Marble",
  "Limestone",
  "Sandstone",
  
  // Wood Materials
  "Hardwood",
  "Softwood",
  "Plywood",
  "MDF",
  "Particle Board",
  "OSB",
  "Lumber",
  "Timber",
  
  // Glass Materials
  "Float Glass",
  "Tempered Glass",
  "Laminated Glass",
  "Insulated Glass",
  "Low-E Glass",
  "Safety Glass",
  
  // Plastic Materials
  "PVC",
  "HDPE",
  "LDPE",
  "PP",
  "ABS",
  "Acrylic",
  "Polycarbonate",
  "Fiberglass",
  
  // Insulation Materials
  "Fiberglass Insulation",
  "Mineral Wool",
  "Cellulose",
  "Spray Foam",
  "Rigid Foam",
  "Reflective Insulation",
  
  // Roofing Materials
  "Asphalt Shingles",
  "Metal Roofing",
  "Clay Tiles",
  "Concrete Tiles",
  "Slate",
  "Membrane Roofing",
  "EPDM",
  "TPO",
  
  // Flooring Materials
  "Ceramic Tile",
  "Porcelain Tile",
  "Natural Stone",
  "Hardwood Flooring",
  "Laminate",
  "Vinyl",
  "Carpet",
  "Epoxy Flooring",
  
  // Electrical Materials
  "Copper Wire",
  "Aluminum Wire",
  "Electrical Conduit",
  "Cable",
  "Switches",
  "Outlets",
  "Circuit Breakers",
  
  // Plumbing Materials
  "Copper Pipe",
  "PVC Pipe",
  "PEX Pipe",
  "Cast Iron Pipe",
  "Galvanized Pipe",
  "Fittings",
  "Valves",
  
  // Paint & Coatings
  "Interior Paint",
  "Exterior Paint",
  "Primer",
  "Stain",
  "Varnish",
  "Sealant",
  "Caulk",
  
  // Adhesives & Sealants
  "Construction Adhesive",
  "Epoxy",
  "Silicone Sealant",
  "Polyurethane Sealant",
  "Mortar",
  "Grout",
  
  // Aggregates
  "Sand",
  "Gravel",
  "Crushed Stone",
  "Pea Gravel",
  "River Rock",
  "Limestone",
  "Granite Aggregate",
  
  // Chemicals & Additives
  "Cement",
  "Lime",
  "Gypsum",
  "Fly Ash",
  "Silica Fume",
  "Admixtures",
  "Waterproofing Compound",
  
  // Hardware & Fasteners
  "Nails",
  "Screws",
  "Bolts",
  "Nuts",
  "Washers",
  "Anchors",
  "Hinges",
  "Locks",
  
  // Specialized Materials
  "Geotextile",
  "Waterproof Membrane",
  "Vapor Barrier",
  "Fire Retardant",
  "Sound Insulation",
  "Thermal Insulation"
];

// Currency options
export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" }
];

// Weight units
export const WEIGHT_UNITS = [
  { value: "tonnes", label: "Tonnes" },
  { value: "kg", label: "Kilograms" },
  { value: "lbs", label: "Pounds" },
  { value: "tons", label: "Tons (US)" }
];

// Project types
export const PROJECT_TYPES = [
  "Highway",
  "Bridge", 
  "Building",
  "Industrial",
  "Commercial",
  "Residential",
  "Residential Construction",
  "Commercial Construction",
  "Industrial Construction",
  "Infrastructure",
  "Highway Construction",
  "Bridge Construction",
  "Tunnel Construction",
  "Airport Construction",
  "Railway Construction",
  "Water Treatment Plant",
  "Power Plant",
  "Hospital Construction",
  "School Construction",
  "Office Building",
  "Shopping Mall",
  "Hotel Construction",
  "Warehouse Construction",
  "Manufacturing Facility",
  "Data Center",
  "Sports Complex",
  "Museum Construction",
  "Religious Building",
  "Mixed-Use Development",
  "Renovation",
  "Demolition"
];

// Construction materials with units for dropdown
export const CONSTRUCTION_MATERIALS_WITH_UNITS = [
  // Structural Materials
  { name: "Steel", unit: "tonnes" },
  { name: "Reinforced Steel", unit: "tonnes" },
  { name: "Stainless Steel", unit: "tonnes" },
  { name: "Aluminum", unit: "tonnes" },
  { name: "Iron", unit: "tonnes" },
  { name: "Concrete", unit: "cubic meters" },
  { name: "Reinforced Concrete", unit: "cubic meters" },
  { name: "Precast Concrete", unit: "pieces" },
  { name: "Ready Mix Concrete", unit: "cubic meters" },
  
  // Masonry Materials
  { name: "Brick", unit: "pieces" },
  { name: "Clay Brick", unit: "pieces" },
  { name: "Concrete Block", unit: "pieces" },
  { name: "Cement Block", unit: "pieces" },
  { name: "Stone", unit: "cubic meters" },
  { name: "Granite", unit: "square meters" },
  { name: "Marble", unit: "square meters" },
  { name: "Limestone", unit: "cubic meters" },
  { name: "Sandstone", unit: "cubic meters" },
  
  // Wood Materials
  { name: "Hardwood", unit: "cubic meters" },
  { name: "Softwood", unit: "cubic meters" },
  { name: "Plywood", unit: "sheets" },
  { name: "MDF", unit: "sheets" },
  { name: "Particle Board", unit: "sheets" },
  { name: "OSB", unit: "sheets" },
  { name: "Lumber", unit: "cubic meters" },
  { name: "Timber", unit: "cubic meters" },
  
  // Glass Materials
  { name: "Float Glass", unit: "square meters" },
  { name: "Tempered Glass", unit: "square meters" },
  { name: "Laminated Glass", unit: "square meters" },
  { name: "Insulated Glass", unit: "square meters" },
  { name: "Low-E Glass", unit: "square meters" },
  { name: "Safety Glass", unit: "square meters" },
  
  // Plastic Materials
  { name: "PVC", unit: "meters" },
  { name: "HDPE", unit: "meters" },
  { name: "LDPE", unit: "meters" },
  { name: "PP", unit: "meters" },
  { name: "ABS", unit: "meters" },
  { name: "Acrylic", unit: "square meters" },
  { name: "Polycarbonate", unit: "square meters" },
  { name: "Fiberglass", unit: "square meters" },
  
  // Insulation Materials
  { name: "Fiberglass Insulation", unit: "square meters" },
  { name: "Mineral Wool", unit: "square meters" },
  { name: "Cellulose", unit: "bags" },
  { name: "Spray Foam", unit: "cans" },
  { name: "Rigid Foam", unit: "sheets" },
  { name: "Reflective Insulation", unit: "square meters" },
  
  // Roofing Materials
  { name: "Asphalt Shingles", unit: "bundles" },
  { name: "Metal Roofing", unit: "square meters" },
  { name: "Clay Tiles", unit: "pieces" },
  { name: "Concrete Tiles", unit: "pieces" },
  { name: "Slate", unit: "square meters" },
  { name: "Membrane Roofing", unit: "square meters" },
  { name: "EPDM", unit: "square meters" },
  { name: "TPO", unit: "square meters" },
  
  // Flooring Materials
  { name: "Ceramic Tile", unit: "square meters" },
  { name: "Porcelain Tile", unit: "square meters" },
  { name: "Natural Stone", unit: "square meters" },
  { name: "Hardwood Flooring", unit: "square meters" },
  { name: "Laminate", unit: "square meters" },
  { name: "Vinyl", unit: "square meters" },
  { name: "Carpet", unit: "square meters" },
  { name: "Epoxy Flooring", unit: "gallons" },
  
  // Electrical Materials
  { name: "Copper Wire", unit: "meters" },
  { name: "Aluminum Wire", unit: "meters" },
  { name: "Electrical Conduit", unit: "meters" },
  { name: "Cable", unit: "meters" },
  { name: "Switches", unit: "pieces" },
  { name: "Outlets", unit: "pieces" },
  { name: "Circuit Breakers", unit: "pieces" },
  
  // Plumbing Materials
  { name: "Copper Pipe", unit: "meters" },
  { name: "PVC Pipe", unit: "meters" },
  { name: "PEX Pipe", unit: "meters" },
  { name: "Cast Iron Pipe", unit: "meters" },
  { name: "Galvanized Pipe", unit: "meters" },
  { name: "Fittings", unit: "pieces" },
  { name: "Valves", unit: "pieces" },
  
  // Paint & Coatings
  { name: "Interior Paint", unit: "gallons" },
  { name: "Exterior Paint", unit: "gallons" },
  { name: "Primer", unit: "gallons" },
  { name: "Stain", unit: "gallons" },
  { name: "Varnish", unit: "gallons" },
  { name: "Sealant", unit: "tubes" },
  { name: "Caulk", unit: "tubes" },
  
  // Adhesives & Sealants
  { name: "Construction Adhesive", unit: "tubes" },
  { name: "Epoxy", unit: "kits" },
  { name: "Silicone Sealant", unit: "tubes" },
  { name: "Polyurethane Sealant", unit: "tubes" },
  { name: "Mortar", unit: "bags" },
  { name: "Grout", unit: "bags" },
  
  // Aggregates
  { name: "Sand", unit: "cubic meters" },
  { name: "Gravel", unit: "cubic meters" },
  { name: "Crushed Stone", unit: "cubic meters" },
  { name: "Pea Gravel", unit: "cubic meters" },
  { name: "River Rock", unit: "cubic meters" },
  { name: "Limestone", unit: "cubic meters" },
  { name: "Granite Aggregate", unit: "cubic meters" },
  
  // Chemicals & Additives
  { name: "Cement", unit: "bags" },
  { name: "Lime", unit: "bags" },
  { name: "Gypsum", unit: "bags" },
  { name: "Fly Ash", unit: "bags" },
  { name: "Silica Fume", unit: "bags" },
  { name: "Admixtures", unit: "gallons" },
  { name: "Waterproofing Compound", unit: "gallons" },
  
  // Hardware & Fasteners
  { name: "Nails", unit: "pounds" },
  { name: "Screws", unit: "pounds" },
  { name: "Bolts", unit: "pieces" },
  { name: "Nuts", unit: "pieces" },
  { name: "Washers", unit: "pieces" },
  { name: "Anchors", unit: "pieces" },
  { name: "Hinges", unit: "pieces" },
  { name: "Locks", unit: "pieces" },
  
  // Specialized Materials
  { name: "Geotextile", unit: "square meters" },
  { name: "Waterproof Membrane", unit: "square meters" },
  { name: "Vapor Barrier", unit: "square meters" },
  { name: "Fire Retardant", unit: "gallons" },
  { name: "Sound Insulation", unit: "square meters" },
  { name: "Thermal Insulation", unit: "square meters" }
];