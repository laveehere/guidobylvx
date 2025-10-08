// Enhanced CulturalBot with Free APIs Integration
// Performance-optimized with real API calls

// Secure Configuration with Environment Variable Support
// Priority: 1) Runtime config 2) Build-time env vars 3) Default values

// Function to safely get configuration values
function getEnvVar(key, defaultValue = null) {
    // Try multiple sources for environment variables
    if (typeof window !== 'undefined' && window.CONFIG && window.CONFIG[key]) {
        return window.CONFIG[key];
    }
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
    }
    return defaultValue;
}

// Secure API Configuration
const API_CONFIG = {
    // OpenWeatherMap Free API (1000 calls/day)
    weather: {
        apiKey: getEnvVar('OPENWEATHER_API_KEY'),
        baseUrl: 'https://api.openweathermap.org/data/2.5',
        get enabled() { return !!this.apiKey && this.apiKey !== 'YOUR_OPENWEATHER_API_KEY' && this.apiKey !== null; }
    },
    
    // Nominatim (OpenStreetMap) - Completely free
    places: {
        baseUrl: 'https://nominatim.openstreetmap.org',
        enabled: true
    },
    
    // Hugging Face Inference API - Free
    ai: {
        apiKey: getEnvVar('HUGGINGFACE_TOKEN'),
        baseUrl: 'https://api-inference.huggingface.co',
        get enabled() { return !!this.apiKey && this.apiKey !== 'YOUR_HUGGING_FACE_TOKEN' && this.apiKey !== null; }
    },
    
    // NewsAPI Free (1000 requests/day)
    news: {
        apiKey: getEnvVar('NEWS_API_KEY'),
        baseUrl: 'https://newsapi.org/v2',
        get enabled() { return !!this.apiKey && this.apiKey !== 'YOUR_NEWSAPI_KEY' && this.apiKey !== null; }
    }
};

// Add configuration status logging
console.log('🔧 API Configuration Status (Live-First Mode):');
console.log('Weather API:', API_CONFIG.weather.enabled ? '✅ LIVE - OpenWeatherMap' : '⚠️ DEMO - Add API key for live data');
console.log('Places API:', API_CONFIG.places.enabled ? '✅ LIVE - OpenStreetMap' : '❌ DISABLED');
console.log('AI API:', API_CONFIG.ai.enabled ? '✅ LIVE - Hugging Face' : '⚠️ DEMO - Add token for live responses');
console.log('News API:', API_CONFIG.news.enabled ? '✅ LIVE - NewsAPI' : '⚠️ DEMO - Add API key for live news');
console.log('🎯 Priority: Live APIs → Demo fallback only when APIs fail');

// Global variables
let currentCity = 'tokyo';
let responseCache = new Map();
let apiCallCount = { weather: 0, places: 0, ai: 0, news: 0 };

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    updateAPIStatus();
});

function initializeApp() {
    addBotMessage('🚀 Enhanced CulturalBot is ready! Prioritizing live APIs for authentic, real-time information.', '🤖 System Ready');
    
    // Show API capabilities and status
    setTimeout(() => {
        const apiInfo = document.createElement('div');
        apiInfo.className = 'api-powered';
        
        // Check API status and provide appropriate messaging
        const weatherLive = API_CONFIG.weather.enabled;
        const placesLive = API_CONFIG.places.enabled;
        const aiLive = API_CONFIG.ai.enabled;
        const newsLive = API_CONFIG.news.enabled;
        
        let statusMessage = '<strong>🔥 Live Data Sources:</strong><br>';
        
        statusMessage += `• Weather: ${weatherLive ? '✅ Live OpenWeatherMap' : '⚠️ Demo data (add API key for live)'}<br>`;
        statusMessage += `• Places: ${placesLive ? '✅ Live OpenStreetMap' : '❌ Error'}<br>`;
        statusMessage += `• AI Responses: ${aiLive ? '✅ Live Hugging Face' : '⚠️ Demo data (add token for live)'}<br>`;
        statusMessage += `• News/Events: ${newsLive ? '✅ Live NewsAPI' : '⚠️ Demo data (add API key for live)'}<br>`;
        
        if (!weatherLive || !aiLive || !newsLive) {
            statusMessage += '<br><strong>💡 For full live experience:</strong> Add your API keys in config.js';
        }
        
        apiInfo.innerHTML = statusMessage;
        document.getElementById('messages').appendChild(apiInfo);
        document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
    }, 1000);
}

function setupEventListeners() {
    // City selector change
    document.getElementById('citySelect').addEventListener('change', function() {
        currentCity = this.value;
        updateCityInfo();
    });
    
    // Category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            handleCategoryClick(this.dataset.category);
        });
    });
    
    // Enter key for message input
    document.getElementById('messageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

function updateAPIStatus() {
    document.getElementById('weatherStatus').className = 
        API_CONFIG.weather.enabled ? 'status-active' : 'status-inactive';
    document.getElementById('placesStatus').className = 
        API_CONFIG.places.enabled ? 'status-active' : 'status-inactive';
    document.getElementById('aiStatus').className = 
        API_CONFIG.ai.enabled ? 'status-active' : 'status-inactive';
    document.getElementById('eventsStatus').className = 
        API_CONFIG.news.enabled ? 'status-active' : 'status-inactive';
}

// Enhanced Weather API with caching
class WeatherAPI {
    static cache = new Map();
    static cacheTimeout = 10 * 60 * 1000; // 10 minutes
    
    static async getCurrentWeather(city) {
        const cacheKey = `weather_${city}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log('🎯 Using cached weather data');
            return cached.data;
        }
        
        // Priority 1: Try live API if enabled
        if (API_CONFIG.weather.enabled) {
            try {
                console.log('🌤️ Fetching LIVE weather data from OpenWeatherMap...');
                const response = await fetch(
                    `${API_CONFIG.weather.baseUrl}/weather?q=${city}&appid=${API_CONFIG.weather.apiKey}&units=metric`
                );
                
                if (response.ok) {
                    const data = await response.json();
                    const weatherData = {
                        temperature: Math.round(data.main.temp),
                        condition: data.weather[0].description,
                        humidity: data.main.humidity,
                        windSpeed: data.wind.speed,
                        pressure: data.main.pressure,
                        timestamp: new Date().toLocaleString(),
                        source: 'OpenWeatherMap API (LIVE)',
                        isRealTime: true
                    };
                    
                    // Cache the result
                    this.cache.set(cacheKey, {
                        data: weatherData,
                        timestamp: Date.now()
                    });
                    
                    apiCallCount.weather++;
                    console.log('✅ Successfully fetched LIVE weather data');
                    return weatherData;
                } else {
                    console.log('⚠️ Weather API response error:', response.status);
                }
            } catch (error) {
                console.error('❌ Weather API error:', error);
            }
        }
        
        // Priority 2: Fallback to demo data when API fails or not configured
        console.log('📊 Using demo weather data (API unavailable or failed)');
        return this.getSimulatedWeather(city);
    }
    
    static getSimulatedWeather(city) {
        const temps = { tokyo: 22, paris: 16, mumbai: 28, delhi: 32, newyork: 18 };
        return {
            temperature: temps[city] || 20,
            condition: 'partly cloudy',
            humidity: 65,
            windSpeed: 5.2,
            pressure: 1013,
            timestamp: new Date().toLocaleString(),
            source: 'Demo Data (Add API key for live)',
            isRealTime: false
        };
    }
}

// Places API using OpenStreetMap Nominatim (Free)
class PlacesAPI {
    static cache = new Map();
    static cacheTimeout = 30 * 60 * 1000; // 30 minutes
    
    static async searchPlaces(city, category) {
        const cacheKey = `places_${city}_${category}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log('🎯 Using cached places data');
            return cached.data;
        }
        
        // Priority 1: Always try live OpenStreetMap API first (it's free)
        try {
            console.log('📍 Fetching LIVE places data from OpenStreetMap...');
            // Generate proper search queries for each category and city
            const searchQueries = this.generateSearchQueries(city, category);
            const allPlaces = [];
            
            // Search for multiple query types to get diverse results
            for (const query of searchQueries) {
                try {
                    const response = await fetch(
                        `${API_CONFIG.places.baseUrl}/search?q=${encodeURIComponent(query)}&format=json&limit=3&addressdetails=1&bounded=1&extratags=1`
                    );
                    
                    if (response.ok) {
                        const data = await response.json();
                        const places = data
                            .filter(place => place.display_name && place.lat && place.lon)
                            .map(place => ({
                                name: this.extractLocationName(place),
                                address: place.display_name,
                                lat: place.lat,
                                lon: place.lon,
                                type: place.type || place.class || 'attraction',
                                category: place.class,
                                importance: place.importance || 0,
                                source: 'OpenStreetMap (LIVE)'
                            }));
                        
                        allPlaces.push(...places);
                    }
                    
                    // Add small delay between requests to be respectful to the API
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (queryError) {
                    console.log(`Query failed: ${query}`, queryError);
                }
            }
            
            // Remove duplicates and sort by importance
            const uniquePlaces = this.removeDuplicates(allPlaces);
            const sortedPlaces = uniquePlaces
                .sort((a, b) => (b.importance || 0) - (a.importance || 0))
                .slice(0, 5); // Limit to top 5 results
            
            // If we got good results from live API, use them
            if (sortedPlaces.length > 0) {
                // Cache the result
                this.cache.set(cacheKey, {
                    data: sortedPlaces,
                    timestamp: Date.now()
                });
                
                apiCallCount.places++;
                console.log('✅ Successfully fetched LIVE places data');
                return sortedPlaces;
            }
            
        } catch (error) {
            console.error('❌ Places API error:', error);
        }
        
        // Priority 2: Fallback to curated demo data when API fails or returns no results
        console.log('📊 Using demo places data (API failed or no results)');
        return this.getFallbackPlaces(city, category);
    }
    
    // Generate appropriate search queries based on city and category
    static generateSearchQueries(city, category) {
    const queries = [];

    const cityData = {
        delhi: {
            culture: ['Red Fort Delhi', 'Qutub Minar Delhi', 'Humayun Tomb Delhi', 'Lotus Temple Delhi', 'National Museum Delhi'],
            tourist: ['India Gate Delhi', 'Red Fort Delhi', 'Lotus Temple Delhi', 'Akshardham Temple Delhi'],
            food: ['restaurants Delhi', 'popular restaurants Delhi', 'local food Delhi', 'best places to eat Delhi'],
            shopping: ['markets Delhi', 'famous shopping markets Delhi', 'shopping districts Delhi', 'local bazaars Delhi']
        },
        tokyo: {
            culture: ['Senso-ji Temple Tokyo', 'Meiji Shrine Tokyo', 'Tokyo National Museum', 'Imperial Palace Tokyo'],
            tourist: ['Tokyo Tower', 'Tokyo Skytree', 'Shibuya Crossing Tokyo', 'Asakusa Tokyo'],
            food: ['restaurants Tokyo', 'Tsukiji Market Tokyo', 'best sushi Tokyo', 'local food Tokyo'],
            shopping: ['Shibuya shopping district Tokyo', 'Harajuku shopping Tokyo', 'Ginza Tokyo markets', 'Akihabara Tokyo']
        },
        mumbai: {
            culture: ['Gateway of India Mumbai', 'Chhatrapati Shivaji Terminus Mumbai', 'Elephanta Caves Mumbai'],
            tourist: ['Marine Drive Mumbai', 'Gateway of India Mumbai', 'Juhu Beach Mumbai'],
            food: ['restaurants Mumbai', 'Mohammed Ali Road Mumbai', 'best street food Mumbai', 'local food Mumbai'],
            shopping: ['Linking Road Mumbai', 'Colaba Causeway Mumbai', 'Crawford Market Mumbai', 'Fashion Street Mumbai']
        },
        paris: {
            culture: ['Louvre Museum Paris', 'Notre Dame Paris', 'Musée d\'Orsay Paris', 'Sainte-Chapelle Paris'],
            tourist: ['Eiffel Tower Paris', 'Arc de Triomphe Paris', 'Champs-Élysées Paris', 'Montmartre Paris'],
            food: ['restaurants Paris', 'Le Marais Paris food', 'Latin Quarter Paris restaurants', 'best bistros Paris'],
            shopping: ['Champs-Élysées Paris shops', 'Le Marais Paris markets', 'Galeries Lafayette Paris', 'Rue Saint-Honoré Paris']
        },
        newyork: {
            culture: ['Metropolitan Museum New York', 'MoMA New York', 'Guggenheim Museum New York'],
            tourist: ['Statue of Liberty New York', 'Central Park New York', 'Times Square New York', 'Brooklyn Bridge New York'],
            food: ['restaurants New York', 'Little Italy New York', 'Chinatown New York', 'best pizza New York'],
            shopping: ['Fifth Avenue New York', 'SoHo New York', 'Chelsea Market New York', 'Union Square Market New York']
        },
        london: {
            culture: ['British Museum London', 'Tate Modern London', 'National Gallery London', 'Westminster Abbey London'],
            tourist: ['Big Ben London', 'Tower Bridge London', 'London Eye', 'Buckingham Palace London'],
            food: ['restaurants London', 'Borough Market London', 'Camden Market London food', 'Covent Garden London'],
            shopping: ['Oxford Street London', 'Camden Market London shops', 'Portobello Road London', 'Covent Garden Market London']
        },
        istanbul: {
            culture: ['Hagia Sophia Istanbul', 'Blue Mosque Istanbul', 'Topkapi Palace Istanbul'],
            tourist: ['Galata Tower Istanbul', 'Bosphorus Bridge Istanbul', 'Taksim Square Istanbul'],
            food: ['restaurants Istanbul', 'Grand Bazaar Istanbul food', 'Eminönü Istanbul restaurants', 'local food Istanbul'],
            shopping: ['Grand Bazaar Istanbul', 'Istinye Park Istanbul', 'Spice Bazaar Istanbul', 'Nişantaşı Istanbul']
        },
        barcelona: {
            culture: ['Sagrada Familia Barcelona', 'Park Güell Barcelona', 'Picasso Museum Barcelona'],
            tourist: ['Casa Batlló Barcelona', 'Gothic Quarter Barcelona', 'La Rambla Barcelona'],
            food: ['restaurants Barcelona', 'Boquería Market Barcelona', 'Gothic Quarter Barcelona food', 'local tapas Barcelona'],
            shopping: ['Passeig de Gràcia Barcelona', 'Gothic Quarter Barcelona shops', 'El Born Barcelona markets']
        }
    };

    const cityQueries = cityData[city];

    if (cityQueries && cityQueries[category]) {
        queries.push(...cityQueries[category].slice(0, 5));
    }

    if (queries.length === 0) {
        switch (category) {
            case 'culture':
                queries.push(`museums ${city}`, `temples ${city}`, `heritage sites ${city}`, `art galleries ${city}`);
                break;
            case 'food':
                queries.push(`restaurants ${city}`, `food markets ${city}`, `local cuisine ${city}`, `best places to eat ${city}`);
                break;
            case 'shopping':
                queries.push(`famous markets ${city}`, `shopping districts ${city}`, `local bazaars ${city}`, `markets ${city}`);
                break;
            case 'places':
            case 'tourist':
                queries.push(`tourist attractions ${city}`, `landmarks ${city}`, `monuments ${city}`, `famous places ${city}`);
                break;
            default:
                queries.push(`${category} in ${city}`, `top ${category} ${city}`);
        }
    }

    queries.push(`${category} in ${city}`, `top ${category} ${city}`);

    return queries.slice(0, 5);
}
    
    // Extract a clean location name from the API response
    static extractLocationName(place) {
        // Try to get a clean name from various fields
        if (place.namedetails && place.namedetails.name) {
            return place.namedetails.name;
        }
        
        if (place.display_name) {
            // Take the first part before the first comma
            const firstPart = place.display_name.split(',')[0].trim();
            return firstPart;
        }
        
        return place.name || place.type || 'Unnamed Location';
    }
    
    // Remove duplicate places based on name and coordinates
    static removeDuplicates(places) {
        const seen = new Set();
        return places.filter(place => {
            const key = `${place.name.toLowerCase()}_${Math.round(place.lat * 1000)}_${Math.round(place.lon * 1000)}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
    
    // Fallback places when API fails
    static getFallbackPlaces(city, category) {
        const fallbacks = {
            delhi: {
                culture: [
                    { name: 'Red Fort', address: 'Netaji Subhash Marg, Lal Qila, Delhi', type: 'historical_monument', source: 'Demo Data (API failed)' },
                    { name: 'Qutub Minar', address: 'Mehrauli, Delhi', type: 'unesco_heritage', source: 'Demo Data (API failed)' },
                    { name: 'Humayun\'s Tomb', address: 'Mathura Road, Delhi', type: 'mughal_architecture', source: 'Demo Data (API failed)' }
                ],
                tourist: [
                    { name: 'India Gate', address: 'Rajpath, New Delhi', type: 'war_memorial', source: 'Demo Data (API failed)' },
                    { name: 'Lotus Temple', address: 'Lotus Temple Road, Delhi', type: 'bahai_temple', source: 'Demo Data (API failed)' },
                    { name: 'Akshardham Temple', address: 'Noida Mor, Delhi', type: 'hindu_temple', source: 'Demo Data (API failed)' }
                ],
                shopping: [
                    { name: 'Connaught Place', address: 'Connaught Place, New Delhi', type: 'shopping_district', source: 'Demo Data (API failed)' },
                    { name: 'Khan Market', address: 'Khan Market, New Delhi', type: 'market', source: 'Demo Data (API failed)' }
                ],
                food: [
                    { name: 'Chandni Chowk', address: 'Chandni Chowk, Old Delhi', type: 'food_street', source: 'Demo Data (API failed)' },
                    { name: 'Paranthe Wali Gali', address: 'Chandni Chowk, Delhi', type: 'food_lane', source: 'Demo Data (API failed)' }
                ]
            },
            tokyo: {
                culture: [
                    { name: 'Senso-ji Temple', address: 'Asakusa, Tokyo', type: 'buddhist_temple', source: 'Demo Data (API failed)' },
                    { name: 'Meiji Shrine', address: 'Shibuya, Tokyo', type: 'shinto_shrine', source: 'Demo Data (API failed)' },
                    { name: 'Tokyo National Museum', address: 'Ueno, Tokyo', type: 'museum', source: 'Demo Data (API failed)' }
                ],
                tourist: [
                    { name: 'Tokyo Tower', address: 'Minato, Tokyo', type: 'landmark', source: 'Demo Data (API failed)' },
                    { name: 'Tokyo Skytree', address: 'Sumida, Tokyo', type: 'broadcasting_tower', source: 'Demo Data (API failed)' },
                    { name: 'Shibuya Crossing', address: 'Shibuya, Tokyo', type: 'intersection', source: 'Demo Data (API failed)' }
                ],
                shopping: [
                    { name: 'Shibuya', address: 'Shibuya, Tokyo', type: 'shopping_district', source: 'Demo Data (API failed)' },
                    { name: 'Harajuku', address: 'Harajuku, Tokyo', type: 'fashion_district', source: 'Demo Data (API failed)' }
                ],
                food: [
                    { name: 'Tsukiji Outer Market', address: 'Chuo, Tokyo', type: 'fish_market', source: 'Demo Data (API failed)' },
                    { name: 'Ramen Yokocho', address: 'Shinjuku, Tokyo', type: 'ramen_alley', source: 'Demo Data (API failed)' }
                ]
            },
            mumbai: {
                culture: [
                    { name: 'Gateway of India', address: 'Apollo Bunder, Mumbai', type: 'historical_monument', source: 'Demo Data (API failed)' },
                    { name: 'Chhatrapati Shivaji Terminus', address: 'Fort, Mumbai', type: 'railway_station', source: 'Demo Data (API failed)' }
                ],
                tourist: [
                    { name: 'Marine Drive', address: 'Marine Drive, Mumbai', type: 'promenade', source: 'Demo Data (API failed)' },
                    { name: 'Juhu Beach', address: 'Juhu, Mumbai', type: 'beach', source: 'Demo Data (API failed)' }
                ],
                shopping: [
                    { name: 'Linking Road', address: 'Bandra West, Mumbai', type: 'shopping_street', source: 'Demo Data (API failed)' },
                    { name: 'Colaba Causeway', address: 'Colaba, Mumbai', type: 'shopping_street', source: 'Demo Data (API failed)' }
                ],
                food: [
                    { name: 'Mohammed Ali Road', address: 'Mohammed Ali Road, Mumbai', type: 'food_street', source: 'Demo Data (API failed)' }
                ]
            },
            paris: {
                culture: [
                    { name: 'Louvre Museum', address: 'Rue de Rivoli, Paris', type: 'art_museum', source: 'Demo Data (API failed)' },
                    { name: 'Notre-Dame', address: 'Île de la Cité, Paris', type: 'cathedral', source: 'Demo Data (API failed)' }
                ],
                tourist: [
                    { name: 'Eiffel Tower', address: 'Champ de Mars, Paris', type: 'iron_tower', source: 'Demo Data (API failed)' },
                    { name: 'Arc de Triomphe', address: 'Place Charles de Gaulle, Paris', type: 'triumphal_arch', source: 'Demo Data (API failed)' }
                ],
                shopping: [
                    { name: 'Champs-Élysées', address: 'Champs-Élysées, Paris', type: 'shopping_avenue', source: 'Demo Data (API failed)' }
                ],
                food: [
                    { name: 'Latin Quarter', address: 'Latin Quarter, Paris', type: 'dining_district', source: 'Demo Data (API failed)' }
                ]
            },
            newyork: {
                culture: [
                    { name: 'Metropolitan Museum', address: 'Upper East Side, New York', type: 'art_museum', source: 'Demo Data (API failed)' },
                    { name: 'MoMA', address: 'Midtown Manhattan, New York', type: 'modern_art_museum', source: 'Demo Data (API failed)' }
                ],
                tourist: [
                    { name: 'Statue of Liberty', address: 'Liberty Island, New York', type: 'statue', source: 'Demo Data (API failed)' },
                    { name: 'Central Park', address: 'Manhattan, New York', type: 'urban_park', source: 'Demo Data (API failed)' }
                ],
                shopping: [
                    { name: 'Fifth Avenue', address: 'Fifth Avenue, Manhattan', type: 'shopping_avenue', source: 'Demo Data (API failed)' }
                ],
                food: [
                    { name: 'Little Italy', address: 'Little Italy, Manhattan', type: 'ethnic_neighborhood', source: 'Demo Data (API failed)' }
                ]
            },
            london: {
                culture: [
                    { name: 'British Museum', address: 'Great Russell Street, London', type: 'history_museum', source: 'Demo Data (API failed)' },
                    { name: 'Tate Modern', address: 'Bankside, London', type: 'art_gallery', source: 'Demo Data (API failed)' }
                ],
                tourist: [
                    { name: 'Big Ben', address: 'Westminster, London', type: 'clock_tower', source: 'Demo Data (API failed)' },
                    { name: 'Tower Bridge', address: 'Tower Hamlets, London', type: 'bridge', source: 'Demo Data (API failed)' }
                ],
                shopping: [
                    { name: 'Oxford Street', address: 'Oxford Street, London', type: 'shopping_street', source: 'Demo Data (API failed)' }
                ],
                food: [
                    { name: 'Borough Market', address: 'Southwark, London', type: 'food_market', source: 'Demo Data (API failed)' }
                ]
            },
            istanbul: {
                culture: [
                    { name: 'Hagia Sophia', address: 'Sultanahmet, Istanbul', type: 'historical_building', source: 'Demo Data (API failed)' },
                    { name: 'Topkapi Palace', address: 'Sultanahmet, Istanbul', type: 'palace_museum', source: 'Demo Data (API failed)' }
                ],
                tourist: [
                    { name: 'Blue Mosque', address: 'Sultanahmet, Istanbul', type: 'mosque', source: 'Demo Data (API failed)' },
                    { name: 'Galata Tower', address: 'Galata, Istanbul', type: 'medieval_tower', source: 'Demo Data (API failed)' }
                ],
                shopping: [
                    { name: 'Grand Bazaar', address: 'Beyazıt, Istanbul', type: 'covered_market', source: 'Demo Data (API failed)' }
                ],
                food: [
                    { name: 'Eminönü', address: 'Eminönü, Istanbul', type: 'food_district', source: 'Demo Data (API failed)' }
                ]
            },
            barcelona: {
                culture: [
                    { name: 'Sagrada Familia', address: 'Sagrada Família, Barcelona', type: 'basilica', source: 'Demo Data (API failed)' },
                    { name: 'Park Güell', address: 'Gràcia, Barcelona', type: 'public_park', source: 'Demo Data (API failed)' }
                ],
                tourist: [
                    { name: 'Casa Batlló', address: 'Passeig de Gràcia, Barcelona', type: 'modernist_building', source: 'Demo Data (API failed)' },
                    { name: 'Gothic Quarter', address: 'Ciutat Vella, Barcelona', type: 'historic_district', source: 'Demo Data (API failed)' }
                ],
                shopping: [
                    { name: 'Passeig de Gràcia', address: 'Passeig de Gràcia, Barcelona', type: 'shopping_avenue', source: 'Demo Data (API failed)' }
                ],
                food: [
                    { name: 'Boquería Market', address: 'La Rambla, Barcelona', type: 'public_market', source: 'Demo Data (API failed)' }
                ]
            }
        };
        
        // Get city and category specific fallbacks
        const cityFallbacks = fallbacks[city];
        if (cityFallbacks && cityFallbacks[category]) {
            return cityFallbacks[category];
        }
        
        // Generic fallback if no specific data available
        return [
            { name: `Popular ${category} destination in ${city}`, address: `${city} city center`, type: category, source: 'Demo Data (API failed)' },
            { name: `Local ${category} spot in ${city}`, address: `${city} downtown area`, type: category, source: 'Demo Data (API failed)' }
        ];
    }
}

// AI Processing using Hugging Face (Free)
class AIAPI {
    static async processQuery(message) {
        if (!API_CONFIG.ai.enabled) {
            return this.getSimulatedResponse(message);
        }
        
        try {
            // Intent classification
            const response = await fetch(
                `${API_CONFIG.ai.baseUrl}/models/facebook/bart-large-mnli`,
                {
                    headers: {
                        'Authorization': `Bearer ${API_CONFIG.ai.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    method: 'POST',
                    body: JSON.stringify({
                        inputs: message,
                        parameters: {
                            candidate_labels: ['weather', 'food', 'culture', 'events', 'places', 'shopping', 'clothing', 'local', 'traditional']
                        }
                    })
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                apiCallCount.ai++;
                return {
                    intent: data.labels[0],
                    confidence: data.scores[0],
                    source: 'Hugging Face AI'
                };
            }
        } catch (error) {
            console.error('AI API error:', error);
        }
        
        return this.getSimulatedResponse(message);
    }
    
    static getSimulatedResponse(message) {
        const lower = message.toLowerCase();
        
        // Weather-related queries
        if (lower.includes('weather') || lower.includes('temperature') || lower.includes('climate') || lower.includes('forecast')) {
            return { intent: 'weather', confidence: 0.9 };
        }
        
        // Food-related queries
        if (lower.includes('food') || lower.includes('restaurant') || lower.includes('eat') || lower.includes('dining') || 
            lower.includes('cuisine') || lower.includes('lunch') || lower.includes('dinner') || lower.includes('breakfast') ||
            lower.includes('cafe') || lower.includes('local food') || lower.includes('street food')) {
            return { intent: 'food', confidence: 0.9 };
        }
        
        // Culture-related queries
        if (lower.includes('culture') || lower.includes('museum') || lower.includes('temple') || lower.includes('heritage') ||
            lower.includes('historical') || lower.includes('monument') || lower.includes('cultural sites') || 
            lower.includes('art') || lower.includes('gallery') || lower.includes('cultural attractions')) {
            return { intent: 'culture', confidence: 0.9 };
        }
        
        // Shopping-related queries
        if (lower.includes('shopping') || lower.includes('shop') || lower.includes('market') || lower.includes('mall') ||
            lower.includes('buy') || lower.includes('store') || lower.includes('shopping area') || lower.includes('boutique') ||
            lower.includes('bazaar') || lower.includes('shopping district')) {
            return { intent: 'shopping', confidence: 0.9 };
        }
        
        // Events-related queries
        if (lower.includes('event') || lower.includes('festival') || lower.includes('concert') || lower.includes('show') ||
            lower.includes('happening') || lower.includes('activities') || lower.includes('entertainment') || 
            lower.includes('nightlife') || lower.includes('what to do')) {
            return { intent: 'events', confidence: 0.9 };
        }
        
        // Traditional clothing queries
        if (lower.includes('clothing') || lower.includes('traditional') || lower.includes('wear') || lower.includes('dress') ||
            lower.includes('costume') || lower.includes('attire') || lower.includes('kimono') || lower.includes('saree') ||
            lower.includes('traditional wear') || lower.includes('cultural clothing')) {
            return { intent: 'clothing', confidence: 0.9 };
        }
        
        // Places/Tourist attractions queries
        if (lower.includes('places') || lower.includes('attractions') || lower.includes('landmarks') || lower.includes('visit') ||
            lower.includes('sightseeing') || lower.includes('tourist') || lower.includes('interesting places') || 
            lower.includes('must see') || lower.includes('famous places') || lower.includes('tourist attractions')) {
            return { intent: 'places', confidence: 0.9 };
        }
        
        // Local recommendations queries
        if (lower.includes('local') || lower.includes('recommendation') || lower.includes('guide') || 
            lower.includes('comprehensive') || lower.includes('local guide') || lower.includes('insider tips') ||
            lower.includes('what locals do') || lower.includes('local experience') || lower.includes('comprehensive guide')) {
            return { intent: 'local', confidence: 0.9 };
        }
        
        // Default to general
        return { intent: 'general', confidence: 0.7 };
    }
}

// Enhanced Traditional Clothing Module with Free APIs
// Provides comprehensive traditional clothing information and shopping guidance

class TraditionalClothingAPI {
    static cache = new Map();
    static cacheTimeout = 60 * 60 * 1000; // 1 hour cache
    
    // Comprehensive traditional clothing database
    static clothingDatabase = {
    tokyo: [
        {
            name: "Kimono",
            type: "formal_wear",
            description: "Traditional Japanese robe with wide sleeves and a broad sash (obi)",
            occasions: ["tea ceremonies", "festivals", "weddings", "formal events"],
            colors: ["deep blue", "cherry blossom pink", "gold", "burgundy"],
            price_range: "¥15,000 - ¥500,000",
            rental_available: true,
            cultural_significance: "Symbol of Japanese culture and tradition",
            where_to_buy: ["Asakusa", "Ginza", "Kyoto (day trip)"],
            styling_tips: "Wear with proper undergarments (juban), choose colors based on season",
            accessories: ["obi (sash)", "geta (wooden sandals)", "hair ornaments"]
        },
        {
            name: "Yukata",
            type: "casual_wear",
            description: "Lightweight cotton kimono, perfect for summer festivals",
            occasions: ["summer festivals", "fireworks displays", "hot springs"],
            colors: ["indigo blue", "white", "floral patterns"],
            price_range: "¥3,000 - ¥20,000",
            rental_available: true,
            cultural_significance: "Casual traditional wear for summer events",
            where_to_buy: ["Shibuya", "Harajuku", "department stores"],
            styling_tips: "Wear with simple obi, perfect for beginners",
            accessories: ["simple obi", "sandals", "hand fan"]
        }
    ],
    mumbai: [
        {
            name: "Saree",
            type: "formal_wear",
            description: "Elegant draped garment, symbol of Indian femininity",
            occasions: ["weddings", "festivals", "formal events", "office wear"],
            colors: ["vibrant reds", "golden yellow", "royal blue", "emerald green"],
            price_range: "₹500 - ₹50,000+",
            rental_available: true,
            cultural_significance: "Represents Indian tradition and elegance",
            where_to_buy: ["Linking Road", "Colaba Causeway", "Crawford Market"],
            styling_tips: "Choose blouse design carefully, draping style varies by region",
            accessories: ["jewelry", "bangles", "bindi", "traditional footwear"]
        }
    ],
    paris: [
        {
            name: "French Provincial Dress",
            type: "regional_wear",
            description: "Traditional French regional costume with embroidered details",
            occasions: ["folk festivals", "cultural events", "themed parties"],
            colors: ["white with colorful embroidery", "blue", "red"],
            price_range: "€50 - €300",
            rental_available: true,
            cultural_significance: "Represents French regional heritage",
            where_to_buy: ["Le Marais", "antique shops", "costume stores"]
        }
    ],
    istanbul: [
        {
            name: "Şalvar",
            type: "traditional_wear",
            description: "Baggy trousers worn traditionally by both men and women",
            occasions: ["daily wear", "cultural festivals"],
            colors: ["white", "earth tones", "bright patterns"],
            price_range: "₺100 - ₺1,000",
            rental_available: false,
            cultural_significance: "Part of traditional Ottoman attire",
            where_to_buy: ["Grand Bazaar", "Kadıköy Market"],
            styling_tips: "Pair with embroidered shirts or vests",
            accessories: ["fez hats", "handcrafted belts"]
        }
    ],
    new_york: [
        {
            name: "Modern Urbanwear",
            type: "casual_wear",
            description: "Fashion-forward clothing inspired by the city’s diversity",
            occasions: ["daily wear", "parties"],
            colors: ["black", "white", "bold colors"],
            price_range: "$50 - $1,000+",
            rental_available: true,
            cultural_significance: "Representation of New York’s dynamic fashion scene",
            where_to_buy: ["SoHo", "Brooklyn boutiques"],
            styling_tips: "Mix vintage and contemporary pieces",
            accessories: ["caps", "sneakers", "statement jewelry"]
        }
    ],
    london: [
        {
            name: "Savile Row Suit",
            type: "formal_wear",
            description: "Tailor-made bespoke suits famous worldwide",
            occasions: ["business", "formal events"],
            colors: ["navy", "gray", "black"],
            price_range: "£500 - £5,000+",
            rental_available: false,
            cultural_significance: "Iconic British tailoring tradition",
            where_to_buy: ["Savile Row"],
            styling_tips: "Complement with crisp shirts and classic ties",
            accessories: ["cufflinks", "leather shoes"]
        }
    ],
    delhi: [
        {
            name: "Kurta Pajama",
            type: "formal_wear",
            description: "Traditional men's outfit made of long shirt and pants",
            occasions: ["festivals", "weddings", "formal occasions"],
            colors: ["white", "cream", "bright colors"],
            price_range: "₹800 - ₹10,000",
            rental_available: true,
            cultural_significance: "Essential traditional wear for Indian men",
            where_to_buy: ["Chandni Chowk", "Janpath Market"],
            styling_tips: "Choose embroidered fabrics for weddings",
            accessories: ["mojari shoes", "shawls"]
        }
    ],
    barcelona: [
        {
            name: "Catalan Traditional Dress",
            type: "regional_wear",
            description: "Colorful traditional costume with symbolic designs",
            occasions: ["festivals", "cultural events"],
            colors: ["red", "yellow", "black"],
            price_range: "€30 - €200",
            rental_available: true,
            cultural_significance: "Represents Catalan identity",
            where_to_buy: ["La Rambla", "local markets"],
            styling_tips: "Wear with matching accessories like sashes",
            accessories: ["berets", "woven belts"]
        }
    ]
};

    // Get comprehensive traditional clothing information
    static async getTraditionalClothing(city, preferences = {}) {
        const cacheKey = `clothing_${city}_${JSON.stringify(preferences)}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        
        const cityData = this.clothingDatabase[city];
        if (!cityData) {
            return this.getGenericClothingInfo(city);
        }
        
        let filteredClothing = Array.isArray(cityData.traditional) ? cityData.traditional : [];

        
        if (preferences.occasion) {
            filteredClothing = filteredClothing.filter(item => 
                item.occasions.some(occ => 
                    occ.toLowerCase().includes(preferences.occasion.toLowerCase())
                )
            );
        }
        
        const result = {
            traditional: filteredClothing,
            shopping_areas: cityData.shopping_areas || [],
            styling_services: await this.findStylingServices(city),
            rental_options: filteredClothing.filter(item => item.rental_available),
            cultural_context: this.getCulturalContext(city)
        };
        
        this.cache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
        
        return result;
    }
    
    // Find styling services using Places API
    static async findStylingServices(city) {
        try {
            const places = await PlacesAPI.searchPlaces(city, 'clothing');
            return places.map(place => ({
                name: place.name,
                address: place.address,
                type: 'styling_service',
                source: 'OpenStreetMap'
            }));
        } catch (error) {
            return [];
        }
    }
    
    // Get cultural context for traditional clothing
    static getCulturalContext(city) {
        const contexts = {
            tokyo: {
                best_seasons: "Spring (cherry blossom) and autumn festivals",
                cultural_etiquette: "Respect traditional dressing rules, consider professional dressing services",
                photo_opportunities: "Temple visits, traditional gardens, cultural districts",
                learning_opportunities: "Kimono dressing classes available in Asakusa and Kyoto"
            },
            mumbai: {
                best_seasons: "Festival seasons (Diwali, Navratri) and wedding season (winter)",
                cultural_etiquette: "Color significance matters, regional draping styles vary",
                photo_opportunities: "Heritage buildings, temples, cultural festivals",
                learning_opportunities: "Saree draping workshops, jewelry styling sessions"
            }
        };
        
        return contexts[city] || {
            best_seasons: "Check local cultural calendar",
            cultural_etiquette: "Research local customs and traditions",
            photo_opportunities: "Cultural sites and traditional markets",
            learning_opportunities: "Local cultural centers and workshops"
        };
    }
    
    // Generic clothing info for cities not in database
    static getGenericClothingInfo(city) {
        return {
            traditional: [
                {
                    name: "Local Traditional Wear",
                    description: "Explore local markets and cultural centers for traditional clothing",
                    where_to_buy: ["local markets", "cultural districts", "heritage areas"],
                    recommendation: "Visit local museums and cultural centers to learn about traditional dress"
                }
            ],
            shopping_areas: [
                {
                    area: "Cultural Districts",
                    specialty: "Traditional and cultural items",
                    best_for: "authentic local experience"
                }
            ],
            cultural_context: {
                recommendation: "Research local customs and visit cultural centers for authentic information"
            }
        };
    }
}

// Local Recommendations API for comprehensive city guidance
class LocalRecommendationsAPI {
    static cache = new Map();
    static cacheTimeout = 30 * 60 * 1000; // 30 minutes
    
    static async getLocalRecommendations(city) {
        const cacheKey = `local_rec_${city}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        
        try {
            // Get comprehensive recommendations using multiple APIs
            const [weather, places, clothing, events] = await Promise.all([
                WeatherAPI.getCurrentWeather(city),
                PlacesAPI.searchPlaces(city, 'tourist'),
                TraditionalClothingAPI.getTraditionalClothing(city),
                NewsAPI.getLocalEvents(city)
            ]);
            
            const recommendations = {
                weather: weather,
                places: places,
                traditional_clothing: clothing,
                events: events,
                local_tips: this.getLocalTips(city),
                budget_options: this.getBudgetRecommendations(city),
                cultural_insights: this.getCulturalInsights(city)
            };
            
            this.cache.set(cacheKey, {
                data: recommendations,
                timestamp: Date.now()
            });
            
            return recommendations;
        } catch (error) {
            console.error('Error getting local recommendations:', error);
            return this.getBasicRecommendations(city);
        }
    }
    
    static getLocalTips(city) {
        const tips = {
            tokyo: [
                "Use IC cards for convenient public transport",
                "Learn basic bowing etiquette",
                "Try convenience store food - it's surprisingly good",
                "Visit both traditional and modern districts"
            ],
            mumbai: [
                "Use local trains for efficient travel",
                "Try street food at Mohammed Ali Road",
                "Bargain at local markets",
                "Respect local customs and dress modestly"
            ],
            paris: [
                "Learn basic French greetings",
                "Visit local cafes for authentic experience",
                "Use metro for easy transportation",
                "Explore beyond tourist areas"
            ]
        };
        
        return tips[city] || [
            "Research local customs before visiting",
            "Try local cuisine and markets",
            "Use public transportation",
            "Respect cultural norms"
        ];
    }
    
    static getBudgetRecommendations(city) {
        return {
            accommodation: "Consider local guesthouses and hostels",
            food: "Try local street food and markets",
            transport: "Use public transportation and walking",
            activities: "Look for free cultural events and museums"
        };
    }
    
    static getCulturalInsights(city) {
        const insights = {
            tokyo: "Balance respect for tradition with openness to innovation",
            mumbai: "Embrace the diversity and energy of the city",
            paris: "Appreciate art, cuisine, and intellectual discourse"
        };
        
        return insights[city] || "Research local cultural values and customs";
    }
    
    static getBasicRecommendations(city) {
        return {
            weather: { temperature: 20, condition: 'pleasant' },
            places: [],
            traditional_clothing: { traditional: [] },
            events: [],
            local_tips: this.getLocalTips(city),
            budget_options: this.getBudgetRecommendations(city),
            cultural_insights: this.getCulturalInsights(city)
        };
    }
}

// News/Events API
class NewsAPI {
    static cache = new Map();
    static cacheTimeout = 60 * 60 * 1000; // 1 hour
    
    static async getLocalEvents(city) {
        const cacheKey = `news_${city}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log('🎯 Using cached news data');
            return cached.data;
        }
        
        if (API_CONFIG.news.enabled) {
            try {
                const response = await fetch(
                    `${API_CONFIG.news.baseUrl}/everything?q=${city} events culture&sortBy=publishedAt&pageSize=3&apiKey=${API_CONFIG.news.apiKey}`
                );
                
                if (response.ok) {
                    const data = await response.json();
                    const events = data.articles.map(article => ({
                        title: article.title,
                        description: article.description,
                        url: article.url,
                        publishedAt: article.publishedAt,
                        source: article.source.name
                    }));
                    
                    // Cache the result
                    this.cache.set(cacheKey, {
                        data: events,
                        timestamp: Date.now()
                    });
                    
                    apiCallCount.news++;
                    return events;
                }
            } catch (error) {
                console.error('News API error:', error);
            }
        }
        
        return this.getSimulatedEvents(city);
    }
    
    static getSimulatedEvents(city) {
        return [
            {
                title: `Local Cultural Festival in ${city}`,
                description: 'Traditional music and food festival happening this weekend',
                source: 'Local Events (Demo)'
            }
        ];
    }
}

// Main message processing function
async function sendMessage(message) {
    if (!message) {
        message = document.getElementById('messageInput').value.trim();
        if (!message) return;
        document.getElementById('messageInput').value = '';
    }
    
    // Add user message
    addUserMessage(message);
    
    // Show loading
    showLoading();
    
    try {
        // Process with AI for intent detection
        const aiResult = await AIAPI.processQuery(message);
        
        // Handle based on detected intent
        switch (aiResult.intent) {
            case 'weather':
                await handleWeatherQuery();
                break;
            case 'food':
                await handleFoodQuery();
                break;
            case 'culture':
                await handleCultureQuery();
                break;
            case 'events':
                await handleEventsQuery();
                break;
            case 'places':
                await handlePlacesQuery();
                break;
            case 'shopping':
                await handleShoppingQuery();
                break;
            case 'clothing':
                await handleEnhancedClothingQuery();
                break;
            case 'local':
                await handleLocalRecommendations();
                break;
            default:
                await handleGeneralQuery();
        }
        
        // Show API usage stats
        showAPIUsageStats();
        
    } catch (error) {
        console.error('Error processing message:', error);
        addBotMessage('Sorry, I encountered an error. Please try again.', '❌ Error');
    } finally {
        hideLoading();
    }
}

async function handleWeatherQuery() {
    const weather = await WeatherAPI.getCurrentWeather(currentCity);
    
    addBotMessage(`Here's the current weather in ${currentCity}:`, '🌤️ Live Weather');
    
    const weatherDiv = document.createElement('div');
    weatherDiv.className = 'weather-info';
    weatherDiv.innerHTML = `
        <h4>🌡️ ${weather.temperature}°C</h4>
        <p><strong>Condition:</strong> ${weather.condition}</p>
        <p><strong>Humidity:</strong> ${weather.humidity}%</p>
        <p><strong>Wind:</strong> ${weather.windSpeed} m/s</p>
        <p><strong>Pressure:</strong> ${weather.pressure} hPa</p>
        <p><small>📡 Source: ${weather.source} | ${weather.timestamp}</small></p>
    `;
    document.getElementById('messages').appendChild(weatherDiv);
    
    if (weather.isRealTime) {
        const indicator = document.createElement('div');
        indicator.className = 'performance-indicator';
        indicator.textContent = '⚡ Real-time data';
        document.getElementById('messages').appendChild(indicator);
    }
}

async function handleFoodQuery() {
    const places = await PlacesAPI.searchPlaces(currentCity, 'food');

    addBotMessage(`Best food places and restaurants in ${currentCity}:`, '🍽️ Local Cuisine');

    if (places.length > 0) {
        places.forEach(place => {
            const placeDiv = document.createElement('div');
            placeDiv.className = 'recommendation';
            placeDiv.innerHTML = `
                <h4>${place.name}</h4>
                <p><strong>📍 Address:</strong> ${place.address}</p>
                <p><strong>🏷️ Type:</strong> ${place.type}</p>
                <p><strong>⭐ Category:</strong> ${place.category || 'Restaurant/Food'}</p>
                <p><strong>📊 Source:</strong> ${place.source}</p>
                ${place.lat && place.lon ? `<p><strong>🗺️ Coordinates:</strong> ${place.lat}, ${place.lon}</p>` : ''}
            `;
            document.getElementById('messages').appendChild(placeDiv);
        });

        const tipDiv = document.createElement('div');
        tipDiv.className = 'api-powered';
        tipDiv.innerHTML = '🍴 <strong>Food tip:</strong> Try local specialties and street food for an authentic experience!';
        document.getElementById('messages').appendChild(tipDiv);
    } else {
        addBotMessage('Could not find specific restaurants via API. Try exploring local food markets or asking locals!', '🤔 Food Suggestion');
    }
}

async function handleEventsQuery() {
    const events = await NewsAPI.getLocalEvents(currentCity);
    
    addBotMessage(`Current events and news in ${currentCity}:`, '📰 Local Events');
    
    events.forEach(event => {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'recommendation';
        eventDiv.innerHTML = `
            <h4>${event.title}</h4>
            <p>${event.description}</p>
            <p><small>📰 Source: ${event.source}</small></p>
            ${event.url ? `<p><a href="${event.url}" target="_blank">🔗 Read more</a></p>` : ''}
        `;
        document.getElementById('messages').appendChild(eventDiv);
    });
}

async function handleCultureQuery() {
    const places = await PlacesAPI.searchPlaces(currentCity, 'culture');
    
    addBotMessage(`Cultural sites and attractions in ${currentCity}:`, '🏛️ Cultural Sites');
    
    if (places.length > 0) {
        places.forEach(place => {
            const placeDiv = document.createElement('div');
            placeDiv.className = 'recommendation';
            placeDiv.innerHTML = `
                <h4>${place.name}</h4>
                <p><strong>📍 Location:</strong> ${place.address}</p>
                <p><strong>🏛️ Type:</strong> ${place.type}</p>
                <p><strong>⭐ Category:</strong> ${place.category || 'Cultural Site'}</p>
                <p><strong>📊 Source:</strong> ${place.source}</p>
                ${place.lat && place.lon ? `<p><strong>🗺️ Coordinates:</strong> ${place.lat}, ${place.lon}</p>` : ''}
            `;
            document.getElementById('messages').appendChild(placeDiv);
        });
    } else {
        addBotMessage('Unable to find specific cultural sites via API. Try visiting local tourism centers for museum and heritage site information!', '🤖 Suggestion');
    }
}

async function handlePlacesQuery() {
    const places = await PlacesAPI.searchPlaces(currentCity, 'tourist');
    
    addBotMessage(`Top tourist attractions and landmarks in ${currentCity}:`, '📍 Tourist Attractions');
    
    if (places.length > 0) {
        places.forEach(place => {
            const placeDiv = document.createElement('div');
            placeDiv.className = 'recommendation';
            placeDiv.innerHTML = `
                <h4>${place.name}</h4>
                <p><strong>📍 Address:</strong> ${place.address}</p>
                <p><strong>🏛️ Type:</strong> ${place.type}</p>
                <p><strong>⭐ Category:</strong> ${place.category || 'Tourist Attraction'}</p>
                <p><strong>📊 Source:</strong> ${place.source}</p>
                ${place.lat && place.lon ? `<p><strong>🗺️ Coordinates:</strong> ${place.lat}, ${place.lon}</p>` : ''}
            `;
            document.getElementById('messages').appendChild(placeDiv);
        });
        
        // Add helpful tip
        const tipDiv = document.createElement('div');
        tipDiv.className = 'api-powered';
        tipDiv.innerHTML = `💡 <strong>Pro tip:</strong> These are major landmarks and attractions. For more detailed information, check official tourism websites or local guides!`;
        document.getElementById('messages').appendChild(tipDiv);
    } else {
        addBotMessage('Unable to find specific attractions via API. I recommend checking official tourism websites or asking locals for the best places to visit!', '🤖 Suggestion');
    }
}

async function handleShoppingQuery() {
    const places = await PlacesAPI.searchPlaces(currentCity, 'shopping');

    addBotMessage(`Famous markets and shopping areas in ${currentCity}:`, '🛍️ Shopping');

    if (places.length > 0) {
        places.forEach(place => {
            const placeDiv = document.createElement('div');
            placeDiv.className = 'recommendation';
            placeDiv.innerHTML = `
                <h4>${place.name}</h4>
                <p><strong>📍 Address:</strong> ${place.address}</p>
                <p><strong>🏬 Type:</strong> ${place.type}</p>
                <p><strong>⭐ Category:</strong> ${place.category || 'Shopping'}</p>
                <p><strong>📊 Source:</strong> ${place.source}</p>
                ${place.lat && place.lon ? `<p><strong>🗺️ Coordinates:</strong> ${place.lat}, ${place.lon}</p>` : ''}
            `;
            document.getElementById('messages').appendChild(placeDiv);
        });
    } else {
        addBotMessage('Try exploring local markets and shopping districts! Check tourism websites for popular shopping areas.', '🤔 Suggestion');
    }
}    

async function handleGeneralQuery() {
    addBotMessage('I can help you with weather, food, culture, events, and places! What would you like to know?', '🤖 General Help');
}

function handleCategoryClick(category) {
    // Remove active class from all buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    const categoryMessages = {
        food: 'Find the best restaurants and local food places',
        places: 'Show me top tourist attractions and landmarks',
        weather: 'Get current weather conditions',
        events: 'What cultural events and activities are happening',
        culture: 'Show museums temples and cultural sites',
        shopping: 'Find the best shopping districts and markets',
        clothing: 'Show traditional clothing and cultural wear options',
        local: 'Give me comprehensive local recommendations and insider tips'
    };
    
    sendMessage(categoryMessages[category] || 'Tell me about this category');
}

function showAPIUsageStats() {
    const total = Object.values(apiCallCount).reduce((sum, count) => sum + count, 0);
    if (total > 0) {
        const statsDiv = document.createElement('div');
        statsDiv.className = 'api-powered';
        statsDiv.innerHTML = `
            <strong>📊 API Calls This Session:</strong> 
            Weather: ${apiCallCount.weather}, 
            Places: ${apiCallCount.places}, 
            AI: ${apiCallCount.ai}, 
            News: ${apiCallCount.news}
            | Total: ${total}
        `;
        document.getElementById('messages').appendChild(statsDiv);
    }
}

function updateCityInfo() {
    const cityNames = {
        tokyo: 'Tokyo, Japan',
        paris: 'Paris, France',
        mumbai: 'Mumbai, India',
        istanbul: 'Istanbul, Turkey',
        newyork: 'New York, USA',
        london: 'London, UK',
        delhi: 'Delhi, India',
        barcelona: 'Barcelona, Spain'
    };
    
    document.getElementById('cityName').textContent = `Welcome to ${cityNames[currentCity]}!`;
    addBotMessage(`Now exploring ${cityNames[currentCity]}! Ask me about weather, food, culture, or events.`, '🌍 City Changed');
}

// Utility functions
function addUserMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.textContent = message;
    document.getElementById('messages').appendChild(messageDiv);
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}

function addBotMessage(message, category = '🤖 CulturalBot') {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    messageDiv.innerHTML = `
        <div class="category">${category}</div>
        <p>${message}</p>
    `;
    document.getElementById('messages').appendChild(messageDiv);
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}

function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Enhanced clothing query handler
async function handleEnhancedClothingQuery(userPreferences = {}) {
    addBotMessage(`Let me find comprehensive traditional clothing information for ${currentCity}...`, '🧥 Traditional Clothing Expert');

    try {
        const clothingData = await TraditionalClothingAPI.getTraditionalClothing(currentCity, userPreferences);

        if (clothingData.traditional.length > 0) {
            addBotMessage('Here are the traditional clothing options:', '✨ Traditional Wear');

            clothingData.traditional.forEach(item => {
                const clothingDiv = document.createElement('div');
                clothingDiv.className = 'recommendation';
                clothingDiv.innerHTML = `
                    <h4>${item.name} <span style="background: #e74c3c; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">${item.type.toUpperCase()}</span></h4>
                    <p><strong>Description:</strong> ${item.description}</p>
                    <p>🎭 <strong>Best for:</strong> ${item.occasions.join(', ')}</p>
                    <p>🎨 <strong>Popular colors:</strong> ${item.colors ? item.colors.join(', ') : 'Various'}</p>
                    <p>💰 <strong>Price range:</strong> ${item.price_range}</p>
                    ${item.rental_available ? '<p>🏠 <strong>Rental available:</strong> Yes</p>' : ''}
                    <p>🛒 <strong>Where to buy:</strong> ${item.where_to_buy.join(', ')}</p>
                    ${item.styling_tips ? `<p>💡 <strong>Styling tips:</strong> ${item.styling_tips}</p>` : ''}
                    ${item.accessories ? `<p>👗 <strong>Accessories:</strong> ${item.accessories.join(', ')}</p>` : ''}
                    <p><small>📚 <strong>Cultural significance:</strong> ${item.cultural_significance}</small></p>
                `;
                document.getElementById('messages').appendChild(clothingDiv);
            });
        } else {
            addBotMessage('Sorry, no detailed traditional clothing data available for this city.', 'ℹ️ Info');
        }

        const context = clothingData.cultural_context;
        if (context) {
            const contextDiv = document.createElement('div');
            contextDiv.className = 'ai-insight';
            contextDiv.style.cssText = 'background: linear-gradient(135deg, #ff9a56, #ff6b9d); color: white; padding: 10px; border-radius: 8px; margin: 10px 0;';
            contextDiv.innerHTML = `
                <strong>🎭 Cultural Guide:</strong><br>
                <strong>Best seasons:</strong> ${context.best_seasons}<br>
                <strong>Cultural etiquette:</strong> ${context.cultural_etiquette}<br>
                <strong>Photo opportunities:</strong> ${context.photo_opportunities}<br>
                <strong>Learning opportunities:</strong> ${context.learning_opportunities}
            `;
            document.getElementById('messages').appendChild(contextDiv);
        }

        if (clothingData.rental_options.length > 0) {
            addBotMessage(`⚡ Pro tip: ${clothingData.rental_options.length} items available for rental - perfect for trying traditional wear without buying!`, '💰 Budget Tip');
        }

    } catch (error) {
        console.error('Error getting clothing information:', error);
        addBotMessage('I found some basic traditional clothing information. For detailed guidance, I recommend visiting local cultural centers!', '🧥 Basic Info');
    }
}

// Local recommendations handler
async function handleLocalRecommendations() {
    addBotMessage(`Getting comprehensive local recommendations for ${currentCity}...`, '🗺️ Local Expert');
    
    try {
        const localData = await LocalRecommendationsAPI.getLocalRecommendations(currentCity);
        
        // Display weather
        if (localData.weather) {
            const weatherDiv = document.createElement('div');
            weatherDiv.className = 'weather-info';
            weatherDiv.innerHTML = `
                <h4>🌡️ Current Weather: ${localData.weather.temperature}°C</h4>
                <p><strong>Condition:</strong> ${localData.weather.condition}</p>
            `;
            document.getElementById('messages').appendChild(weatherDiv);
        }
        
        // Display local tips
        if (localData.local_tips && localData.local_tips.length > 0) {
            addBotMessage('Essential local tips:', '💡 Local Insights');
            const tipsDiv = document.createElement('div');
            tipsDiv.className = 'recommendation';
            tipsDiv.innerHTML = `
                <h4>🎯 Insider Tips</h4>
                <ul>
                    ${localData.local_tips.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
            `;
            document.getElementById('messages').appendChild(tipsDiv);
        }
        
        // Display budget recommendations
        if (localData.budget_options) {
            const budgetDiv = document.createElement('div');
            budgetDiv.className = 'recommendation';
            budgetDiv.innerHTML = `
                <h4>💰 Budget-Friendly Options</h4>
                <p><strong>🏨 Accommodation:</strong> ${localData.budget_options.accommodation}</p>
                <p><strong>🍽️ Food:</strong> ${localData.budget_options.food}</p>
                <p><strong>🚌 Transport:</strong> ${localData.budget_options.transport}</p>
                <p><strong>🎭 Activities:</strong> ${localData.budget_options.activities}</p>
            `;
            document.getElementById('messages').appendChild(budgetDiv);
        }
        
        // Display cultural insights
        if (localData.cultural_insights) {
            const cultureDiv = document.createElement('div');
            cultureDiv.className = 'ai-insight';
            cultureDiv.style.cssText = 'background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 10px; border-radius: 8px; margin: 10px 0;';
            cultureDiv.innerHTML = `
                <strong>🌍 Cultural Insight:</strong><br>
                ${localData.cultural_insights}
            `;
            document.getElementById('messages').appendChild(cultureDiv);
        }
        
        // Quick action buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'quick-suggestions';
        actionsDiv.innerHTML = `
            <button class="quick-btn" onclick="handleEnhancedClothingQuery()">👘 Traditional Clothing</button>
            <button class="quick-btn" onclick="handleFoodQuery()">🍽️ Food Places</button>
            <button class="quick-btn" onclick="handleEventsQuery()">🎭 Events</button>
            <button class="quick-btn" onclick="handleCultureQuery()">🏛️ Culture</button>
        `;
        document.getElementById('messages').appendChild(actionsDiv);
        
    } catch (error) {
        console.error('Error getting local recommendations:', error);
        addBotMessage('I can provide basic recommendations. Try asking about specific categories like food, culture, or events!', '🗺️ Basic Recommendations');
    }
}

// Initialize performance monitoring
console.log('🚀 Enhanced CulturalBot with Free APIs loaded!');
console.log('📊 Available APIs:', Object.keys(API_CONFIG));
