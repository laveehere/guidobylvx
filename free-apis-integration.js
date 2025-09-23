// AI-Enhanced CulturalBot with Precision Search
// Uses Hugging Face AI for query-specific, accurate results

// Secure Configuration with Environment Variable Support
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

// API Configuration
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
    addBotMessage('🤖 AI-Enhanced CulturalBot Ready! Using AI for precise, query-specific results.', '🚀 System Ready');
    
    setTimeout(() => {
        const statusDiv = document.createElement('div');
        statusDiv.className = 'api-powered';
        statusDiv.innerHTML = `
            <strong>🔥 AI-Enhanced Features:</strong><br>
            • Places: ${API_CONFIG.places.enabled ? '✅ Live OpenStreetMap + AI Search' : '❌ Error'}<br>
            • AI Search: ${API_CONFIG.ai.enabled ? '✅ Live Hugging Face AI' : '⚠️ Basic search (add token for AI)'}<br>
            • Weather: ${API_CONFIG.weather.enabled ? '✅ Live OpenWeatherMap' : '⚠️ Demo data'}<br>
            • News: ${API_CONFIG.news.enabled ? '✅ Live NewsAPI' : '⚠️ Demo data'}<br>
            <br><strong>🎯 Different queries = Different results!</strong>
        `;
        document.getElementById('messages').appendChild(statusDiv);
        document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
    }, 1000);
}

function setupEventListeners() {
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    sendButton.addEventListener('click', handleUserInput);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleUserInput();
        }
    });
}

function updateAPIStatus() {
    console.log('🔧 AI-Enhanced API Status:');
    console.log('Places + AI:', API_CONFIG.places.enabled && API_CONFIG.ai.enabled ? '✅ FULL AI POWER' : '⚠️ BASIC SEARCH');
    console.log('Weather:', API_CONFIG.weather.enabled ? '✅ LIVE' : '⚠️ DEMO');
    console.log('News:', API_CONFIG.news.enabled ? '✅ LIVE' : '⚠️ DEMO');
}

// AI-Enhanced Places API Class
class AIPlacesAPI {
    static cache = new Map();
    static cacheTimeout = 30 * 60 * 1000; // 30 minutes
    
    static async searchPlaces(city, category) {
        const cacheKey = `ai_places_${city}_${category}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log('🎯 Using cached AI-enhanced results');
            return cached.data;
        }
        
        console.log(`🤖 Starting AI-enhanced search for ${category} in ${city}...`);
        
        // Step 1: Generate AI-powered search queries
        const searchQueries = await this.generateAIQueries(city, category);
        console.log('🔍 AI generated queries:', searchQueries);
        
        // Step 2: Execute targeted searches with AI queries
        const allResults = [];
        for (const query of searchQueries) {
            const results = await this.searchWithQuery(query, category);
            allResults.push(...results);
        }
        
        // Step 3: Apply AI-based filtering and ranking
        const filteredResults = this.applyIntelligentFiltering(allResults, category);
        const rankedResults = this.rankByRelevance(filteredResults, category);
        const finalResults = rankedResults.slice(0, 6);
        
        // Cache results
        if (finalResults.length > 0) {
            this.cache.set(cacheKey, {
                data: finalResults,
                timestamp: Date.now()
            });
            apiCallCount.places++;
            console.log(`✅ Found ${finalResults.length} AI-enhanced ${category} results`);
        } else {
            console.log(`⚠️ No relevant ${category} places found`);
        }
        
        return finalResults;
    }
    
    // AI Query Generation - The Core Innovation
    static async generateAIQueries(city, category) {
        if (!API_CONFIG.ai.enabled) {
            console.log('⚠️ AI not available, using smart fallback queries');
            return this.getSmartFallbackQueries(city, category);
        }
        
        try {
            const prompt = this.buildCategoryPrompt(city, category);
            
            const response = await fetch(`${API_CONFIG.ai.baseUrl}/models/microsoft/DialoGPT-medium`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_CONFIG.ai.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_new_tokens: 150,
                        temperature: 0.2, // Lower for more focused results
                        return_full_text: false
                    }
                })
            });
            
            if (response.ok) {
                const aiResult = await response.json();
                const aiText = Array.isArray(aiResult) ? aiResult[0]?.generated_text : aiResult.generated_text;
                
                if (aiText) {
                    const queries = this.parseAIResponse(aiText, city);
                    apiCallCount.ai++;
                    console.log('🤖 AI successfully generated queries');
                    return queries.length > 0 ? queries : this.getSmartFallbackQueries(city, category);
                }
            }
        } catch (error) {
            console.error('❌ AI query generation failed:', error);
        }
        
        return this.getSmartFallbackQueries(city, category);
    }
    
    // Category-specific AI prompts for precision
    static buildCategoryPrompt(city, category) {
        const prompts = {
            culture: `List 5 specific cultural sites in ${city}: museums, temples, galleries, historical monuments, cultural centers. Only names:`,
            food: `List 5 specific food places in ${city}: famous restaurants, food markets, dining areas, local eateries, culinary districts. Only names:`,
            tourist: `List 5 specific tourist attractions in ${city}: landmarks, towers, parks, famous buildings, must-see places. Only names:`,
            shopping: `List 5 specific shopping locations in ${city}: shopping centers, markets, commercial streets, malls, shopping districts. Only names:`
        };
        
        return prompts[category] || prompts.tourist;
    }
    
    // Parse AI response into search queries
    static parseAIResponse(aiText, city) {
        const lines = aiText.split(/[,\n]/).map(line => line.trim());
        const queries = [];
        
        for (const line of lines) {
            // Clean up AI response
            const cleaned = line
                .replace(/^\d+\.?\s*[-•]?\s*/, '') // Remove numbers and bullets
                .replace(/['"]/g, '') // Remove quotes
                .trim();
            
            if (cleaned && cleaned.length > 2 && !cleaned.toLowerCase().includes('list')) {
                queries.push(`${cleaned} ${city}`);
            }
        }
        
        return queries.slice(0, 4); // Limit to 4 queries
    }
    
    // Smart fallback when AI is not available
    static getSmartFallbackQueries(city, category) {
        const fallbackQueries = {
            culture: [`museums ${city}`, `temples ${city}`, `cultural sites ${city}`, `art galleries ${city}`],
            food: [`restaurants ${city}`, `food markets ${city}`, `dining ${city}`, `cafes ${city}`],
            tourist: [`tourist attractions ${city}`, `landmarks ${city}`, `sightseeing ${city}`, `famous places ${city}`],
            shopping: [`shopping ${city}`, `malls ${city}`, `markets ${city}`, `shopping centers ${city}`]
        };
        
        return fallbackQueries[category] || fallbackQueries.tourist;
    }
    
    // Execute search with a specific query
    static async searchWithQuery(query, category) {
        try {
            const response = await fetch(
                `${API_CONFIG.places.baseUrl}/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&bounded=1&extratags=1`
            );
            
            if (!response.ok) return [];
            
            const data = await response.json();
            return data
                .filter(place => place.display_name && place.lat && place.lon)
                .map(place => ({
                    name: this.extractPlaceName(place),
                    address: place.display_name,
                    lat: parseFloat(place.lat),
                    lon: parseFloat(place.lon),
                    type: place.type || 'attraction',
                    category: place.class || 'general',
                    importance: place.importance || 0,
                    source: 'OpenStreetMap (AI-Enhanced)',
                    rawData: place
                }));
                
        } catch (error) {
            console.error(`Search failed for query: ${query}`, error);
            return [];
        }
    }
    
    // Extract clean place name from API response
    static extractPlaceName(place) {
        if (place.name) return place.name;
        
        const displayName = place.display_name;
        const firstPart = displayName.split(',')[0];
        return firstPart.length < 50 ? firstPart : place.type || 'Place';
    }
    
    // AI-based intelligent filtering
    static applyIntelligentFiltering(places, category) {
        const categoryKeywords = {
            culture: ['museum', 'temple', 'shrine', 'gallery', 'cultural', 'heritage', 'historical', 'monument', 'palace', 'church', 'cathedral', 'mosque', 'art'],
            food: ['restaurant', 'cafe', 'food', 'dining', 'market', 'cuisine', 'eatery', 'kitchen', 'bistro', 'deli', 'bakery'],
            tourist: ['attraction', 'landmark', 'tower', 'park', 'square', 'bridge', 'building', 'site', 'place', 'center'],
            shopping: ['shop', 'shopping', 'mall', 'market', 'store', 'center', 'plaza', 'bazaar', 'outlet', 'commercial']
        };
        
        const keywords = categoryKeywords[category] || [];
        
        return places.filter(place => {
            const searchText = `${place.name} ${place.type} ${place.category} ${place.address}`.toLowerCase();
            return keywords.some(keyword => searchText.includes(keyword));
        });
    }
    
    // Rank results by category relevance
    static rankByRelevance(places, category) {
        return places.map(place => ({
            ...place,
            relevanceScore: this.calculateRelevance(place, category)
        })).sort((a, b) => {
            // Primary sort: relevance score
            if (b.relevanceScore !== a.relevanceScore) {
                return b.relevanceScore - a.relevanceScore;
            }
            // Secondary sort: importance
            return (b.importance || 0) - (a.importance || 0);
        });
    }
    
    // Calculate relevance score
    static calculateRelevance(place, category) {
        let score = 0;
        const text = `${place.name} ${place.type} ${place.category}`.toLowerCase();
        
        const highValueKeywords = {
            culture: ['museum', 'temple', 'gallery', 'heritage', 'palace'],
            food: ['restaurant', 'market', 'cuisine', 'dining'],
            tourist: ['landmark', 'attraction', 'tower', 'famous'],
            shopping: ['mall', 'shopping', 'market', 'center']
        };
        
        const keywords = highValueKeywords[category] || [];
        keywords.forEach(keyword => {
            if (text.includes(keyword)) score += 2;
        });
        
        // Boost score for exact category matches
        if (place.category === category) score += 3;
        if (place.type === category) score += 3;
        
        return score;
    }
}

// Weather API class
class WeatherAPI {
    static cache = new Map();
    static cacheTimeout = 10 * 60 * 1000; // 10 minutes

    static async getCurrentWeather(city) {
        const cacheKey = `weather_${city}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        if (!API_CONFIG.weather.enabled) {
            return this.getDemoWeather(city);
        }

        try {
            const response = await fetch(
                `${API_CONFIG.weather.baseUrl}/weather?q=${city}&appid=${API_CONFIG.weather.apiKey}&units=metric`
            );
            
            if (response.ok) {
                const data = await response.json();
                const result = {
                    temperature: Math.round(data.main.temp),
                    description: data.weather[0].description,
                    humidity: data.main.humidity,
                    windSpeed: data.wind.speed,
                    source: 'OpenWeatherMap (LIVE)'
                };
                
                this.cache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now()
                });
                
                apiCallCount.weather++;
                return result;
            }
        } catch (error) {
            console.error('Weather API error:', error);
        }
        
        return this.getDemoWeather(city);
    }
    
    static getDemoWeather(city) {
        const demoData = {
            tokyo: { temperature: 22, description: 'partly cloudy', humidity: 65, windSpeed: 3.2 },
            delhi: { temperature: 28, description: 'clear sky', humidity: 45, windSpeed: 2.8 },
            default: { temperature: 20, description: 'pleasant', humidity: 60, windSpeed: 2.5 }
        };
        
        return {
            ...demoData[city] || demoData.default,
            source: 'Demo Data (Add API key for live weather)'
        };
    }
}

// News API class
class NewsAPI {
    static cache = new Map();
    static cacheTimeout = 60 * 60 * 1000; // 1 hour

    static async getCityNews(city) {
        const cacheKey = `news_${city}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        if (!API_CONFIG.news.enabled) {
            return this.getDemoNews(city);
        }

        try {
            const response = await fetch(
                `${API_CONFIG.news.baseUrl}/everything?q=${city}&sortBy=publishedAt&pageSize=5&apiKey=${API_CONFIG.news.apiKey}`
            );
            
            if (response.ok) {
                const data = await response.json();
                const result = data.articles.slice(0, 3).map(article => ({
                    title: article.title,
                    description: article.description,
                    url: article.url,
                    publishedAt: article.publishedAt,
                    source: `${article.source.name} (LIVE)`
                }));
                
                this.cache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now()
                });
                
                apiCallCount.news++;
                return result;
            }
        } catch (error) {
            console.error('News API error:', error);
        }
        
        return this.getDemoNews(city);
    }
    
    static getDemoNews(city) {
        const demoNews = {
            tokyo: [
                { title: `Tokyo Cultural Festival 2025`, description: 'Annual festival showcasing traditional arts', source: 'Demo News', publishedAt: '2025-09-20' }
            ],
            delhi: [
                { title: `Delhi Heritage Walk`, description: 'Guided tours of historical monuments', source: 'Demo News', publishedAt: '2025-09-20' }
            ]
        };
        
        return demoNews[city] || [
            { title: `${city} Events Today`, description: 'Check local event listings for current activities', source: 'Demo Data (Add API key for live news)', publishedAt: '2025-09-20' }
        ];
    }
}

// Intent Recognition System
class IntentRecognition {
    static analyzeIntent(message) {
        const lower = message.toLowerCase();
        
        // City change detection
        const cities = ['tokyo', 'delhi', 'mumbai', 'paris', 'london', 'newyork', 'barcelona', 'istanbul'];
        for (const city of cities) {
            if (lower.includes(city)) {
                return { intent: 'city_change', city: city, confidence: 0.9 };
            }
        }
        
        // Weather queries
        if (lower.includes('weather') || lower.includes('temperature') || lower.includes('climate')) {
            return { intent: 'weather', confidence: 0.9 };
        }
        
        // Culture queries - most specific
        if (lower.includes('museum') || lower.includes('temple') || lower.includes('cultural') || 
            lower.includes('heritage') || lower.includes('art') || lower.includes('gallery') ||
            lower.includes('historical') || lower.includes('monument')) {
            return { intent: 'culture', confidence: 0.95 };
        }
        
        // Food queries - specific
        if (lower.includes('restaurant') || lower.includes('food') || lower.includes('dining') ||
            lower.includes('eat') || lower.includes('cuisine') || lower.includes('cafe')) {
            return { intent: 'food', confidence: 0.9 };
        }
        
        // Shopping queries - specific  
        if (lower.includes('shopping') || lower.includes('shop') || lower.includes('mall') ||
            lower.includes('market') || lower.includes('buy') || lower.includes('store')) {
            return { intent: 'shopping', confidence: 0.9 };
        }
        
        // Tourist/general places - catch all
        if (lower.includes('places') || lower.includes('attractions') || lower.includes('visit') ||
            lower.includes('tourist') || lower.includes('sightseeing') || lower.includes('landmark')) {
            return { intent: 'tourist', confidence: 0.8 };
        }
        
        // News and events
        if (lower.includes('news') || lower.includes('events') || lower.includes('happening')) {
            return { intent: 'news', confidence: 0.9 };
        }
        
        // General/conversational
        return { intent: 'general', confidence: 0.5 };
    }
}

// Main message handling
async function handleUserInput() {
    const userInput = document.getElementById('user-input');
    const message = userInput.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addUserMessage(message);
    userInput.value = '';
    
    // Show typing indicator
    const typingDiv = addBotMessage('🤖 Analyzing your query with AI...', '🔍 Processing');
    
    // Analyze intent
    const intent = IntentRecognition.analyzeIntent(message);
    console.log('Detected intent:', intent);
    
    // Handle based on intent
    try {
        switch (intent.intent) {
            case 'city_change':
                currentCity = intent.city;
                removeMessage(typingDiv);
                addBotMessage(`🌍 Switched to ${currentCity.charAt(0).toUpperCase() + currentCity.slice(1)}! What would you like to explore?`, '🗺️ City Changed');
                break;
                
            case 'weather':
                removeMessage(typingDiv);
                await handleWeatherQuery();
                break;
                
            case 'culture':
                removeMessage(typingDiv);
                await handleCultureQuery();
                break;
                
            case 'food':
                removeMessage(typingDiv);
                await handleFoodQuery();
                break;
                
            case 'shopping':
                removeMessage(typingDiv);
                await handleShoppingQuery();
                break;
                
            case 'tourist':
                removeMessage(typingDiv);
                await handleTouristQuery();
                break;
                
            case 'news':
                removeMessage(typingDiv);
                await handleNewsQuery();
                break;
                
            default:
                removeMessage(typingDiv);
                addBotMessage('I can help you find cultural sites, restaurants, tourist attractions, shopping areas, weather, and news. What interests you?', '🤖 Help');
        }
        
        // Update API call counter
        updateApiCallCounter();
        
    } catch (error) {
        removeMessage(typingDiv);
        addBotMessage('Sorry, I encountered an error. Please try again.', '⚠️ Error');
        console.error('Handler error:', error);
    }
}

// Query handlers
async function handleWeatherQuery() {
    const weather = await WeatherAPI.getCurrentWeather(currentCity);
    
    const weatherDiv = document.createElement('div');
    weatherDiv.className = 'recommendation';
    weatherDiv.innerHTML = `
        <h4>🌤️ Weather in ${currentCity.charAt(0).toUpperCase() + currentCity.slice(1)}</h4>
        <p><strong>Temperature:</strong> ${weather.temperature}°C</p>
        <p><strong>Conditions:</strong> ${weather.description}</p>
        <p><strong>Humidity:</strong> ${weather.humidity}%</p>
        <p><strong>Wind:</strong> ${weather.windSpeed} m/s</p>
        <p><strong>📊 Source:</strong> ${weather.source}</p>
    `;
    document.getElementById('messages').appendChild(weatherDiv);
}

async function handleCultureQuery() {
    addBotMessage(`🏛️ Searching for cultural sites in ${currentCity}...`, '🔍 AI Search');
    
    const places = await AIPlacesAPI.searchPlaces(currentCity, 'culture');
    
    if (places.length > 0) {
        addBotMessage(`Cultural sites and museums in ${currentCity}:`, '🏛️ Cultural Sites');
        places.forEach(place => {
            const placeDiv = document.createElement('div');
            placeDiv.className = 'recommendation';
            placeDiv.innerHTML = `
                <h4>${place.name}</h4>
                <p><strong>📍 Address:</strong> ${place.address}</p>
                <p><strong>🏛️ Type:</strong> ${place.type}</p>
                <p><strong>⭐ Category:</strong> ${place.category}</p>
                <p><strong>📊 Source:</strong> ${place.source}</p>
                ${place.lat && place.lon ? `<p><strong>🗺️ Coordinates:</strong> ${place.lat}, ${place.lon}</p>` : ''}
            `;
            document.getElementById('messages').appendChild(placeDiv);
        });
    } else {
        addBotMessage('No cultural sites found with current search. Try asking about museums or temples specifically.', '🤖 Suggestion');
    }
}

async function handleFoodQuery() {
    addBotMessage(`🍽️ Searching for restaurants in ${currentCity}...`, '🔍 AI Search');
    
    const places = await AIPlacesAPI.searchPlaces(currentCity, 'food');
    
    if (places.length > 0) {
        addBotMessage(`Restaurants and dining in ${currentCity}:`, '🍽️ Food & Dining');
        places.forEach(place => {
            const placeDiv = document.createElement('div');
            placeDiv.className = 'recommendation';
            placeDiv.innerHTML = `
                <h4>${place.name}</h4>
                <p><strong>📍 Address:</strong> ${place.address}</p>
                <p><strong>🍽️ Type:</strong> ${place.type}</p>
                <p><strong>⭐ Category:</strong> ${place.category}</p>
                <p><strong>📊 Source:</strong> ${place.source}</p>
                ${place.lat && place.lon ? `<p><strong>🗺️ Coordinates:</strong> ${place.lat}, ${place.lon}</p>` : ''}
            `;
            document.getElementById('messages').appendChild(placeDiv);
        });
    } else {
        addBotMessage('No restaurants found with current search. Try asking about specific cuisines or dining areas.', '🤖 Suggestion');
    }
}

async function handleShoppingQuery() {
    addBotMessage(`🛍️ Searching for shopping areas in ${currentCity}...`, '🔍 AI Search');
    
    const places = await AIPlacesAPI.searchPlaces(currentCity, 'shopping');
    
    if (places.length > 0) {
        addBotMessage(`Shopping areas in ${currentCity}:`, '🛍️ Shopping');
        places.forEach(place => {
            const placeDiv = document.createElement('div');
            placeDiv.className = 'recommendation';
            placeDiv.innerHTML = `
                <h4>${place.name}</h4>
                <p><strong>📍 Address:</strong> ${place.address}</p>
                <p><strong>🛍️ Type:</strong> ${place.type}</p>
                <p><strong>⭐ Category:</strong> ${place.category}</p>
                <p><strong>📊 Source:</strong> ${place.source}</p>
                ${place.lat && place.lon ? `<p><strong>🗺️ Coordinates:</strong> ${place.lat}, ${place.lon}</p>` : ''}
            `;
            document.getElementById('messages').appendChild(placeDiv);
        });
    } else {
        addBotMessage('No shopping areas found with current search. Try asking about malls or markets specifically.', '🤖 Suggestion');
    }
}

async function handleTouristQuery() {
    addBotMessage(`🗺️ Searching for tourist attractions in ${currentCity}...`, '🔍 AI Search');
    
    const places = await AIPlacesAPI.searchPlaces(currentCity, 'tourist');
    
    if (places.length > 0) {
        addBotMessage(`Tourist attractions in ${currentCity}:`, '🗺️ Tourist Attractions');
        places.forEach(place => {
            const placeDiv = document.createElement('div');
            placeDiv.className = 'recommendation';
            placeDiv.innerHTML = `
                <h4>${place.name}</h4>
                <p><strong>📍 Address:</strong> ${place.address}</p>
                <p><strong>🗺️ Type:</strong> ${place.type}</p>
                <p><strong>⭐ Category:</strong> ${place.category}</p>
                <p><strong>📊 Source:</strong> ${place.source}</p>
                ${place.lat && place.lon ? `<p><strong>🗺️ Coordinates:</strong> ${place.lat}, ${place.lon}</p>` : ''}
            `;
            document.getElementById('messages').appendChild(placeDiv);
        });
    } else {
        addBotMessage('No tourist attractions found with current search. Try asking about landmarks or famous places.', '🤖 Suggestion');
    }
}

async function handleNewsQuery() {
    const news = await NewsAPI.getCityNews(currentCity);
    
    if (news.length > 0) {
        addBotMessage(`Latest news and events in ${currentCity}:`, '📰 News & Events');
        news.forEach(article => {
            const newsDiv = document.createElement('div');
            newsDiv.className = 'recommendation';
            newsDiv.innerHTML = `
                <h4>${article.title}</h4>
                <p>${article.description || 'No description available'}</p>
                <p><strong>📊 Source:</strong> ${article.source}</p>
                <p><strong>📅 Published:</strong> ${new Date(article.publishedAt).toLocaleDateString()}</p>
                ${article.url ? `<p><a href="${article.url}" target="_blank">Read more →</a></p>` : ''}
            `;
            document.getElementById('messages').appendChild(newsDiv);
        });
    } else {
        addBotMessage('No recent news found. Check local news websites for current events.', '🤖 Suggestion');
    }
}

// UI helper functions
function addUserMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.innerHTML = `<div class="message-content">${message}</div>`;
    document.getElementById('messages').appendChild(messageDiv);
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}

function addBotMessage(message, sender = '🤖 CulturalBot') {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    messageDiv.innerHTML = `
        <div class="message-sender">${sender}</div>
        <div class="message-content">${message}</div>
    `;
    document.getElementById('messages').appendChild(messageDiv);
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
    return messageDiv;
}

function removeMessage(messageDiv) {
    if (messageDiv && messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
    }
}

function updateApiCallCounter() {
    const total = Object.values(apiCallCount).reduce((a, b) => a + b, 0);
    const counterDiv = document.createElement('div');
    counterDiv.className = 'api-counter';
    counterDiv.innerHTML = `📊 API Calls: Weather: ${apiCallCount.weather}, Places: ${apiCallCount.places}, AI: ${apiCallCount.ai}, News: ${apiCallCount.news} | Total: ${total}`;
    document.getElementById('messages').appendChild(counterDiv);
}

// Quick action buttons
function createQuickActions() {
    const quickActionsHtml = `
        <div class="quick-actions">
            <button class="quick-btn" onclick="handleCultureQuery()">🏛️ Culture</button>
            <button class="quick-btn" onclick="handleFoodQuery()">🍽️ Food</button>
            <button class="quick-btn" onclick="handleTouristQuery()">🗺️ Tourist</button>
            <button class="quick-btn" onclick="handleShoppingQuery()">🛍️ Shopping</button>
            <button class="quick-btn" onclick="handleWeatherQuery()">🌤️ Weather</button>
            <button class="quick-btn" onclick="handleNewsQuery()">📰 News</button>
        </div>
    `;
    
    const quickDiv = document.createElement('div');
    quickDiv.innerHTML = quickActionsHtml;
    document.getElementById('messages').appendChild(quickDiv);
}

// Initialize quick actions after page load
setTimeout(createQuickActions, 2000);

// ========== MISSING CRITICAL FUNCTIONS - ADD TO END OF FILE ==========

// Main message processing function
async function sendMessage(predefinedMessage = null) {
    const messageInput = document.getElementById('messageInput');
    const message = predefinedMessage || (messageInput ? messageInput.value.trim() : '');
    
    if (!message) return;
    
    // Clear input if not predefined message
    if (messageInput && !predefinedMessage) {
        messageInput.value = '';
    }
    
    // Add user message
    addUserMessage(message);
    
    // Show loading
    showLoading();
    
    try {
        // Simple intent detection
        const intent = detectIntent(message);
        
        // Handle based on detected intent
        switch (intent) {
            case 'weather':
                await handleWeatherQuery();
                break;
            case 'food':
                await handleFoodQuery();
                break;
            case 'culture':
                await handleCultureQuery();
                break;
            case 'shopping':
                await handleShoppingQuery();
                break;
            case 'places':
            case 'tourist':
                await handlePlacesQuery();
                break;
            default:
                await handleGeneralQuery(message);
        }
        
    } catch (error) {
        console.error('Error processing message:', error);
        addBotMessage('Sorry, I encountered an error. Please try again.', '❌ Error');
    } finally {
        hideLoading();
    }
}

// Simple intent detection
function detectIntent(message) {
    const lower = message.toLowerCase();
    
    if (lower.includes('weather') || lower.includes('temperature')) return 'weather';
    if (lower.includes('food') || lower.includes('restaurant') || lower.includes('eat')) return 'food';
    if (lower.includes('culture') || lower.includes('museum') || lower.includes('temple')) return 'culture';
    if (lower.includes('shopping') || lower.includes('shop') || lower.includes('market')) return 'shopping';
    if (lower.includes('places') || lower.includes('attraction') || lower.includes('tourist')) return 'places';
    
    return 'general';
}

// Add user message to chat
function addUserMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.textContent = message;
    document.getElementById('messages').appendChild(messageDiv);
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
    
    // Debug log
    console.log('Message:', message);
}

// Add bot message to chat
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

// Handle category button clicks
function handleCategoryClick(category) {
    const categoryMessages = {
        food: 'Find the best restaurants and local food places',
        places: 'Show me top tourist attractions and landmarks', 
        culture: 'Show museums temples and cultural sites',
        shopping: 'Find the best shopping districts and markets',
        weather: 'Get current weather conditions'
    };
    
    sendMessage(categoryMessages[category] || 'Tell me about this category');
}

// Show/hide loading indicator
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'block';
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
}

// Handler functions
async function handleWeatherQuery() {
    const weather = await WeatherAPI.getCurrentWeather(currentCity);
    
    addBotMessage(`Here's the current weather in ${currentCity}:`, '🌤️ Weather');
    
    const weatherDiv = document.createElement('div');
    weatherDiv.className = 'weather-info';
    weatherDiv.innerHTML = `
        <h4>🌡️ ${weather.temperature}°C</h4>
        <p><strong>Condition:</strong> ${weather.description}</p>
        <p><strong>Humidity:</strong> ${weather.humidity}%</p>
        <p><strong>Wind:</strong> ${weather.windSpeed} m/s</p>
        <p><small>📡 Source: ${weather.source}</small></p>
    `;
    document.getElementById('messages').appendChild(weatherDiv);
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}

async function handleFoodQuery() {
    const places = await AIPlacesAPI.searchPlaces(currentCity, 'food');
    
    addBotMessage(`Here are the best food places in ${currentCity}:`, '🍽️ Food Places');
    
    if (places.length > 0) {
        places.forEach(place => {
            const placeDiv = document.createElement('div');
            placeDiv.className = 'recommendation';
            placeDiv.innerHTML = `
                <h4>🍽️ ${place.name}</h4>
                <p>${place.address}</p>
                <p><small>📡 ${place.source}</small></p>
            `;
            document.getElementById('messages').appendChild(placeDiv);
        });
    } else {
        addBotMessage('No food places found. Try a different search!', '⚠️ No Results');
    }
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}

async function handleCultureQuery() {
    const places = await AIPlacesAPI.searchPlaces(currentCity, 'culture');
    
    addBotMessage(`Here are the cultural sites in ${currentCity}:`, '🏛️ Culture');
    
    if (places.length > 0) {
        places.forEach(place => {
            const placeDiv = document.createElement('div');
            placeDiv.className = 'recommendation';
            placeDiv.innerHTML = `
                <h4>🏛️ ${place.name}</h4>
                <p>${place.address}</p>
                <p><small>📡 ${place.source}</small></p>
            `;
            document.getElementById('messages').appendChild(placeDiv);
        });
    } else {
        addBotMessage('No cultural sites found. Try a different search!', '⚠️ No Results');
    }
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}

async function handleShoppingQuery() {
    const places = await AIPlacesAPI.searchPlaces(currentCity, 'shopping');
    
    addBotMessage(`Here are the shopping areas in ${currentCity}:`, '🛍️ Shopping');
    
    if (places.length > 0) {
        places.forEach(place => {
            const placeDiv = document.createElement('div');
            placeDiv.className = 'recommendation';
            placeDiv.innerHTML = `
                <h4>🛍️ ${place.name}</h4>
                <p>${place.address}</p>
                <p><small>📡 ${place.source}</small></p>
            `;
            document.getElementById('messages').appendChild(placeDiv);
        });
    } else {
        addBotMessage('No shopping areas found. Try a different search!', '⚠️ No Results');
    }
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}

async function handlePlacesQuery() {
    const places = await AIPlacesAPI.searchPlaces(currentCity, 'tourist');
    
    addBotMessage(`Here are the top attractions in ${currentCity}:`, '🗺️ Places');
    
    if (places.length > 0) {
        places.forEach(place => {
            const placeDiv = document.createElement('div');
            placeDiv.className = 'recommendation';
            placeDiv.innerHTML = `
                <h4>📍 ${place.name}</h4>
                <p>${place.address}</p>
                <p><small>📡 ${place.source}</small></p>
            `;
            document.getElementById('messages').appendChild(placeDiv);
        });
    } else {
        addBotMessage('No attractions found. Try a different search!', '⚠️ No Results');
    }
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}

async function handleGeneralQuery(message) {
    addBotMessage(`I understand you're asking about: "${message}". Let me help you with specific information!`, '🤖 Assistant');
    
    // Try to provide helpful suggestions
    const suggestions = [
        'Ask about weather in the current city',
        'Find restaurants and food places', 
        'Discover cultural sites and museums',
        'Explore shopping areas and markets',
        'Get tourist attractions and landmarks'
    ];
    
    const suggestDiv = document.createElement('div');
    suggestDiv.className = 'quick-suggestions';
    suggestDiv.innerHTML = `
        <p><strong>Try asking about:</strong></p>
        <ul>
            ${suggestions.map(s => `<li>${s}</li>`).join('')}
        </ul>
    `;
    document.getElementById('messages').appendChild(suggestDiv);
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}

// Console ready message
console.log('🔧 Critical functions added - buttons should work now!');


