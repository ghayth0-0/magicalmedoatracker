const TMDB_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiZTM0NzY5NGEyOTcyNTJlNWYwNDQ5NTFiOWIyYjY0OCIsInN1YiI6IjY2NzViMDIxOThhYWU2Zjk1YmZjN2JlYSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.IzHeCya0OmuyMXS0tk-uSvjXarG1IE1CFMcMS9sMXbA';
const { createApp } = Vue

createApp({
    data() {
        return {
            tabs: ['Home', 'Watched', 'Watchlist', 'Favorites'],
            currentTab: 'Home',
            searchQuery: '',
            searchResults: [],
            watchedMedia: [],
            watchlist: [],
            trendingMovies: [],
            trendingTVShows: [],
            tabIcons: {
                'Home': 'fas fa-home',
                'Watched': 'fas fa-eye',
                'Watchlist': 'fas fa-list',
                'Favorites': 'fas fa-heart'
            },
            isLoading: false,
            searchError: null,
            isDarkMode: true,
            viewMode: 'grid',
            selectedMedia: null,
            similarMedia: [],
            showModal: false,
            isSearchFocused: false,
        }
    },
    computed: {
        favorites() {
            return this.watchedMedia.filter(item => item.favorite)
        }
    },
    methods: {
        async searchTMDb() {
            if (!this.searchQuery.trim()) {
                this.searchResults = [];
                return;
            }
            this.isLoading = true;
            this.searchError = null;
            try {
                const response = await fetch(
                    `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(this.searchQuery)}`, {
                    headers: {
                        'Authorization': `Bearer ${TMDB_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch results');
                }
                const data = await response.json();
                this.searchResults = data.results.filter(item => 
                    (item.media_type === 'movie' || item.media_type === 'tv') &&
                    (item.title || item.name)
                ).slice(0, 8);
            } catch (error) {
                console.error('Error searching TMDb:', error);
                this.searchError = 'Failed to fetch results. Please try again.';
                this.searchResults = [];
            } finally {
                this.isLoading = false;
            }
        },
        toggleFavorite(item) {
            item.favorite = !item.favorite
            this.saveToLocalStorage()
        },
        removeMedia(item) {
            this.watchedMedia = this.watchedMedia.filter(m => m.id !== item.id)
            this.saveToLocalStorage()
        },
        addToWatchlist(item, event) {
            if (!this.watchlist.find(m => m.id === item.id)) {
                const btn = event.target;
                btn.style.animation = 'addedToList 0.5s ease';
                
                this.showNotification('Added to Watchlist!');
                
                this.watchlist.push({
                    ...item,
                    addedDate: new Date().toISOString()
                });
                
                setTimeout(() => {
                    btn.style.animation = '';
                }, 500);
                
                this.searchQuery = '';
                this.searchResults = [];
                this.saveToLocalStorage();
            }
        },
        removeFromWatchlist(item) {
            this.watchlist = this.watchlist.filter(m => m.id !== item.id)
            this.saveToLocalStorage()
        },
        moveToWatched(item) {
            this.watchedMedia.push({
                ...item,
                rating: 0,
                favorite: false,
                watchedDate: new Date().toISOString()
            })
            this.removeFromWatchlist(item)
            this.saveToLocalStorage()
        },
        updateRating(item, rating) {
            item.rating = rating
            this.saveToLocalStorage()
        },
        saveToLocalStorage() {
            localStorage.setItem('watchedMedia', JSON.stringify(this.watchedMedia))
            localStorage.setItem('watchlist', JSON.stringify(this.watchlist))
        },
        loadFromLocalStorage() {
            const savedWatched = localStorage.getItem('watchedMedia')
            const savedWatchlist = localStorage.getItem('watchlist')
            if (savedWatched) this.watchedMedia = JSON.parse(savedWatched)
            if (savedWatchlist) this.watchlist = JSON.parse(savedWatchlist)
        },
        async fetchTrending() {
            try {
                const movieResponse = await fetch(
                    'https://api.themoviedb.org/3/trending/movie/week', {
                    headers: {
                        'Authorization': `Bearer ${TMDB_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });
                const movieData = await movieResponse.json();
                this.trendingMovies = movieData.results;

                const tvResponse = await fetch(
                    'https://api.themoviedb.org/3/trending/tv/week', {
                    headers: {
                        'Authorization': `Bearer ${TMDB_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });
                const tvData = await tvResponse.json();
                this.trendingTVShows = tvData.results;
            } catch (error) {
                console.error('Error fetching trending:', error);
            }
        },
        async openMediaDetails(media) {
            this.selectedMedia = media;
            this.showModal = true;
            
            try {
                const response = await fetch(
                    `https://api.themoviedb.org/3/${media.media_type}/${media.id}/similar`, {
                    headers: {
                        'Authorization': `Bearer ${TMDB_API_KEY}`,
                    }
                });
                const data = await response.json();
                this.similarMedia = data.results.slice(0, 6);
            } catch (error) {
                console.error('Error fetching similar media:', error);
            }
        },
        closeModal() {
            this.showModal = false;
            this.selectedMedia = null;
            this.similarMedia = [];
        },
        quickAddToWatched(media, event) {
            const btn = event.target;
            btn.style.animation = 'addedToList 0.5s ease';
            
            this.showNotification('Added to Watched!');
            
            this.watchedMedia.push({
                ...media,
                rating: 0,
                favorite: false,
                watchedDate: new Date().toISOString()
            });
            
            setTimeout(() => {
                btn.style.animation = '';
            }, 500);
            
            this.saveToLocalStorage();
        },
        showNotification(message) {
            const notification = document.createElement('div');
            notification.className = 'success-notification';
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 1500);
        },
        toggleTheme() {
            this.isDarkMode = !this.isDarkMode;
            document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
            localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
        },
        focusSearch() {
            this.isSearchFocused = true;
            document.querySelector('.search-bar').classList.add('focused');
        },
        unfocusSearch() {
            if (this.isSearchFocused) {
                this.isSearchFocused = false;
                this.searchQuery = '';
                this.searchResults = [];
                document.querySelector('.search-bar').classList.remove('focused');
            }
        },
    },
    mounted() {
        this.loadFromLocalStorage()
        this.fetchTrending()
        const savedTheme = localStorage.getItem('theme') || 'dark'
        this.isDarkMode = savedTheme === 'dark'
        document.documentElement.setAttribute('data-theme', savedTheme)
    }
}).mount('#app')