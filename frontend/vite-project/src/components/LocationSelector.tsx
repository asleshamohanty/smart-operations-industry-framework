import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search, X } from "lucide-react";

interface LocationSelectorProps {
  value: string;
  onChange: (location: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

// Mock location suggestions - includes real-life mills and industries
const MOCK_LOCATIONS = [
  // Major Cities
  "Mumbai, Maharashtra, India", "Delhi, India", "Bangalore, Karnataka, India", 
  "Chennai, Tamil Nadu, India", "Kolkata, West Bengal, India", "Hyderabad, Telangana, India",
  "Pune, Maharashtra, India", "Ahmedabad, Gujarat, India", "Jaipur, Rajasthan, India",
  "Surat, Gujarat, India", "Lucknow, Uttar Pradesh, India", "Kanpur, Uttar Pradesh, India",
  "Nagpur, Maharashtra, India", "Indore, Madhya Pradesh, India", "Thane, Maharashtra, India",
  "Bhopal, Madhya Pradesh, India", "Visakhapatnam, Andhra Pradesh, India", "Patna, Bihar, India",
  "Vadodara, Gujarat, India", "Ghaziabad, Uttar Pradesh, India", "Ludhiana, Punjab, India",
  "Agra, Uttar Pradesh, India", "Nashik, Maharashtra, India", "Faridabad, Haryana, India",
  "Meerut, Uttar Pradesh, India", "Rajkot, Gujarat, India", "Kalyan, Maharashtra, India",
  "Vasai, Maharashtra, India", "Varanasi, Uttar Pradesh, India", "Srinagar, Jammu and Kashmir, India",
  "Aurangabad, Maharashtra, India", "Navi Mumbai, Maharashtra, India", "Solapur, Maharashtra, India",
  "Vijayawada, Andhra Pradesh, India", "Kolhapur, Maharashtra, India", "Amritsar, Punjab, India",
  "Noida, Uttar Pradesh, India", "Ranchi, Jharkhand, India", "Howrah, West Bengal, India",
  "Coimbatore, Tamil Nadu, India", "Raipur, Chhattisgarh, India", "Jabalpur, Madhya Pradesh, India",
  "Gwalior, Madhya Pradesh, India", "Chandigarh, Chandigarh, India", "Tiruchirappalli, Tamil Nadu, India",
  "Mysore, Karnataka, India", "Bhubaneswar, Odisha, India", "Kochi, Kerala, India",
  "Bhavnagar, Gujarat, India", "Salem, Tamil Nadu, India", "Warangal, Telangana, India",
  "Guntur, Andhra Pradesh, India", "Bhiwandi, Maharashtra, India", "Amravati, Maharashtra, India",
  "Nanded, Maharashtra, India", "Sangli, Maharashtra, India", "Malegaon, Maharashtra, India",
  "Ulhasnagar, Maharashtra, India", "Jalgaon, Maharashtra, India", "Latur, Maharashtra, India",
  "Ahmadnagar, Maharashtra, India", "Dhule, Maharashtra, India", "Ichalkaranji, Maharashtra, India",
  "Parbhani, Maharashtra, India", "Jalna, Maharashtra, India", "Bhusawal, Maharashtra, India",
  "Panvel, Maharashtra, India", "Satara, Maharashtra, India", "Beed, Maharashtra, India",
  "Yavatmal, Maharashtra, India", "Kamptee, Maharashtra, India", "Gondia, Maharashtra, India",
  "Barshi, Maharashtra, India", "Achalpur, Maharashtra, India", "Osmanabad, Maharashtra, India",
  "Nandurbar, Maharashtra, India", "Wardha, Maharashtra, India", "Udgir, Maharashtra, India",
  "Hinganghat, Maharashtra, India", "Akola, Maharashtra, India", "Amalner, Maharashtra, India",
  "Chalisgaon, Maharashtra, India", "Bhadravati, Maharashtra, India", "Sangamner, Maharashtra, India",
  "Lonavla, Maharashtra, India", "Deolali, Maharashtra, India", "Yeola, Maharashtra, India",
  "Umarkhed, Maharashtra, India", "Warud, Maharashtra, India", "Pusad, Maharashtra, India",
  "Uran, Maharashtra, India", "Malkapur, Maharashtra, India", "Mukhed, Maharashtra, India",
  "Mehkar, Maharashtra, India", "Yawal, Maharashtra, India", "Digras, Maharashtra, India",
  "Anjangaon, Maharashtra, India", "Lonar, Maharashtra, India", "Deulgaon Raja, Maharashtra, India",
  "Shirpur, Maharashtra, India", "Savner, Maharashtra, India", "Tasgaon, Maharashtra, India",
  
  // Real-Life Steel Mills & Industries
  "Tata Steel Plant, Jamshedpur, Jharkhand, India", "JSW Steel Plant, Bellary, Karnataka, India",
  "SAIL Steel Plant, Bhilai, Chhattisgarh, India", "Essar Steel Plant, Hazira, Gujarat, India",
  "Jindal Steel Plant, Angul, Odisha, India", "RINL Steel Plant, Visakhapatnam, Andhra Pradesh, India",
  "Bhilai Steel Plant, Bhilai, Chhattisgarh, India", "Durgapur Steel Plant, Durgapur, West Bengal, India",
  "Rourkela Steel Plant, Rourkela, Odisha, India", "Bokaro Steel Plant, Bokaro, Jharkhand, India",
  "Tata Steel Plant, Kalinganagar, Odisha, India", "JSW Steel Plant, Salem, Tamil Nadu, India",
  "SAIL Steel Plant, Rourkela, Odisha, India", "Essar Steel Plant, Paradeep, Odisha, India",
  "Jindal Steel Plant, Raigarh, Chhattisgarh, India", "RINL Steel Plant, Kadapa, Andhra Pradesh, India",
  
  // Cement Plants
  "UltraTech Cement Plant, Gujarat, India", "ACC Cement Plant, Maharashtra, India",
  "Ambuja Cement Plant, Rajasthan, India", "Shree Cement Plant, Rajasthan, India",
  "JK Cement Plant, Karnataka, India", "Ramco Cement Plant, Tamil Nadu, India",
  "India Cements Plant, Tamil Nadu, India", "Prism Cement Plant, Madhya Pradesh, India",
  "UltraTech Cement Plant, Andhra Pradesh, India", "ACC Cement Plant, Karnataka, India",
  "Ambuja Cement Plant, Gujarat, India", "Shree Cement Plant, Haryana, India",
  "JK Cement Plant, Rajasthan, India", "Ramco Cement Plant, Andhra Pradesh, India",
  
  // Automotive & Manufacturing
  "Maruti Suzuki Plant, Gurgaon, Haryana, India", "Hyundai Plant, Chennai, Tamil Nadu, India",
  "Tata Motors Plant, Pune, Maharashtra, India", "Mahindra Plant, Nashik, Maharashtra, India",
  "Bajaj Auto Plant, Pune, Maharashtra, India", "Hero MotoCorp Plant, Gurgaon, Haryana, India",
  "Ashok Leyland Plant, Chennai, Tamil Nadu, India", "Eicher Motors Plant, Chennai, Tamil Nadu, India",
  "Maruti Suzuki Plant, Manesar, Haryana, India", "Hyundai Plant, Sriperumbudur, Tamil Nadu, India",
  "Tata Motors Plant, Sanand, Gujarat, India", "Mahindra Plant, Chakan, Maharashtra, India",
  
  // Textile Mills
  "Reliance Textile Mill, Gujarat, India", "Arvind Mills, Ahmedabad, Gujarat, India",
  "Welspun Textile Mill, Gujarat, India", "Raymond Textile Mill, Maharashtra, India",
  "Grasim Textile Mill, Madhya Pradesh, India", "Reliance Textile Mill, Maharashtra, India",
  "Arvind Mills, Gujarat, India", "Welspun Textile Mill, Maharashtra, India",
  
  // Chemical & Petrochemical Plants
  "Reliance Petrochemical Plant, Gujarat, India", "IOCL Refinery, Mathura, Uttar Pradesh, India",
  "HPCL Refinery, Mumbai, Maharashtra, India", "BPCL Refinery, Kochi, Kerala, India",
  "ONGC Plant, Mumbai, Maharashtra, India", "GAIL Plant, Delhi, India",
  "Reliance Petrochemical Plant, Maharashtra, India", "IOCL Refinery, Panipat, Haryana, India",
  "HPCL Refinery, Visakhapatnam, Andhra Pradesh, India", "BPCL Refinery, Mumbai, Maharashtra, India",
  
  // Power Plants
  "NTPC Power Plant, Delhi, India", "Adani Power Plant, Gujarat, India",
  "Tata Power Plant, Mumbai, Maharashtra, India", "Reliance Power Plant, Madhya Pradesh, India",
  "JSW Energy Plant, Karnataka, India", "NTPC Power Plant, Uttar Pradesh, India",
  "Adani Power Plant, Maharashtra, India", "Tata Power Plant, Gujarat, India",
  
  // Electronics & IT Manufacturing
  "Foxconn Plant, Chennai, Tamil Nadu, India", "Samsung Plant, Noida, Uttar Pradesh, India",
  "Apple Manufacturing, Bangalore, Karnataka, India", "Dell Plant, Chennai, Tamil Nadu, India",
  "HP Plant, Bangalore, Karnataka, India", "Lenovo Plant, Chennai, Tamil Nadu, India",
  
  // Food Processing
  "Nestle Plant, Punjab, India", "ITC Plant, Kolkata, West Bengal, India",
  "Britannia Plant, Tamil Nadu, India", "Parle Plant, Maharashtra, India",
  "Amul Plant, Gujarat, India", "Mother Dairy Plant, Delhi, India",
  
  // Pharmaceutical Plants
  "Sun Pharma Plant, Gujarat, India", "Dr. Reddy's Plant, Hyderabad, Telangana, India",
  "Cipla Plant, Maharashtra, India", "Lupin Plant, Madhya Pradesh, India",
  "Biocon Plant, Karnataka, India", "Aurobindo Plant, Andhra Pradesh, India",
  
  // Ports & Logistics
  "JNPT Port, Mumbai, Maharashtra, India", "Chennai Port, Chennai, Tamil Nadu, India",
  "Kolkata Port, Kolkata, West Bengal, India", "Kandla Port, Gujarat, India",
  "Cochin Port, Kochi, Kerala, India", "Vizag Port, Visakhapatnam, Andhra Pradesh, India",
  
  // Special Economic Zones
  "SEZ Gurgaon, Haryana, India", "SEZ Bangalore, Karnataka, India",
  "SEZ Chennai, Tamil Nadu, India", "SEZ Pune, Maharashtra, India",
  "SEZ Ahmedabad, Gujarat, India", "SEZ Hyderabad, Telangana, India",
  
  // International Locations
  "New York, NY, USA", "Los Angeles, CA, USA", "Chicago, IL, USA", "Houston, TX, USA",
  "Phoenix, AZ, USA", "Philadelphia, PA, USA", "San Antonio, TX, USA", "San Diego, CA, USA",
  "Dallas, TX, USA", "San Jose, CA, USA", "London, UK", "Manchester, UK", "Birmingham, UK",
  "Glasgow, UK", "Liverpool, UK", "Leeds, UK", "Sheffield, UK", "Edinburgh, UK", "Bristol, UK",
  "Leicester, UK", "Tokyo, Japan", "Osaka, Japan", "Kyoto, Japan", "Yokohama, Japan",
  "Nagoya, Japan", "Sapporo, Japan", "Fukuoka, Japan", "Kobe, Japan", "Kawasaki, Japan",
  "Saitama, Japan", "Sydney, Australia", "Melbourne, Australia", "Brisbane, Australia",
  "Perth, Australia", "Adelaide, Australia", "Gold Coast, Australia", "Newcastle, Australia",
  "Canberra, Australia", "Wollongong, Australia", "Hobart, Australia"
];

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  value,
  onChange,
  placeholder = "Search for a location...",
  label,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchTerm) {
      const filtered = MOCK_LOCATIONS.filter(location =>
        location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLocations(filtered.slice(0, 10)); // Limit to 10 results
    } else {
      setFilteredLocations([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLocationSelect = (location: string) => {
    setSearchTerm(location);
    onChange(location);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const clearLocation = () => {
    setSearchTerm("");
    onChange("");
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-4 w-4 text-gray-400" />
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        
        {searchTerm && (
          <button
            type="button"
            onClick={clearLocation}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {isOpen && filteredLocations.length > 0 && (
        <Card
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto"
        >
          <CardContent className="p-0">
            {filteredLocations.map((location, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleLocationSelect(location)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b last:border-b-0"
              >
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{location}</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {isOpen && searchTerm && filteredLocations.length === 0 && (
        <Card
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1"
        >
          <CardContent className="p-4">
            <div className="text-center text-gray-500 text-sm">
              <Search className="h-4 w-4 mx-auto mb-2" />
              No locations found for "{searchTerm}"
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
