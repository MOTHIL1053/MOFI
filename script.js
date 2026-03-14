/* =======================================================
   API CONFIGURATION
   Make sure to replace these keys with your actual API keys!
   ======================================================= */
const OMDB_API_KEY = 'f28086df'; // e.g: 'f28086df'
const TMDB_API_KEY = 'd3dbddd40e5ef102e95f30981c8ede78';
const YOUTUBE_API_KEY = 'AIzaSyCiPguR8u3k7ZaOfWKw3SVmLKuqhCTDKiA';

// Elements
const movieGrid = document.getElementById('movieGrid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const sectionTitle = document.getElementById('sectionTitle');
const logoBtn = document.getElementById('logoBtn');
const wishlistBtn = document.getElementById('wishlistBtn');
const wishlistCount = document.getElementById('wishlistCount');

// UI States
const loadingIndicator = document.getElementById('loadingIndicator');
const errorIndicator = document.getElementById('errorIndicator');
const errorText = document.getElementById('errorText');
const emptyWishlistIndicator = document.getElementById('emptyWishlistIndicator');
const toast = document.getElementById('toast');

// Modal Elements
const modal = document.getElementById('movieModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalPoster = document.getElementById('modalPoster');
const modalTitle = document.getElementById('modalTitle');
const modalRating = document.getElementById('modalRating');
const modalYear = document.getElementById('modalYear');
const modalRuntime = document.getElementById('modalRuntime');
const modalGenre = document.getElementById('modalGenre');
const modalPlot = document.getElementById('modalPlot');
const modalActors = document.getElementById('modalActors');
const modalDirector = document.getElementById('modalDirector');
const modalWriter = document.getElementById('modalWriter');
const modalWishlistBtn = document.getElementById('modalWishlistBtn');
const modalWishlistText = document.getElementById('modalWishlistText');

// Trailer Elements
const videoContainer = document.getElementById('videoContainer');
const trailerIframe = document.getElementById('trailerIframe');
const trailerLoading = document.getElementById('trailerLoading');
const trailerError = document.getElementById('trailerError');

// State Management
let currentWishlist = JSON.parse(localStorage.getItem('movieWishlist')) || [];
let currentOpenedMovie = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    updateWishlistCount();
    loadTrending();
});

// Navigation Links
logoBtn.addEventListener('click', loadTrending);
wishlistBtn.addEventListener('click', loadWishlist);
document.querySelectorAll('.genre-item').forEach(item => {
    item.addEventListener('click', (e) => {
        // Active tag
        document.querySelectorAll('.genre-item').forEach(i => i.classList.remove('active'));
        e.target.classList.add('active');
        fetchByGenre(e.target.dataset.id, e.target.textContent);
    });
});

// Search
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

/* ============================
   VIEWS AND FETCHING LOGIC
   ============================ */

async function loadTrending() {
    clearGrid(`Trending Now`);
    showLoading();

    if (TMDB_API_KEY === 'YOUR_TMDB_API_KEY') {
        hideLoading();
        showError("TMDB API Key required for Trending. Update the key in script.js!");
        return;
    }

    try {
        const res = await fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}`);
        const data = await res.json();
        hideLoading();
        if (data.results && data.results.length > 0) {
            renderMoviesFromTMDB(data.results);
        } else {
            showError("Trend mapping failed. Check TMDB API Data.");
        }
    } catch (err) {
        showError("Network Error.");
    }
}

async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    // reset genres
    document.querySelectorAll('.genre-item').forEach(i => i.classList.remove('active'));
    clearGrid(`Search Results: "${query}"`);
    showLoading();

    try {
        const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
        const data = await res.json();
        hideLoading();

        if (data.results && data.results.length > 0) {
            renderMoviesFromTMDB(data.results);
        } else {
            showError("Movie not found. Try a different title.");
        }
    } catch (err) {
        showError("Failed to fetch search results.");
    }
}

async function fetchByGenre(genreId, genreName) {
    clearGrid(`${genreName} Movies`);
    searchInput.value = '';
    showLoading();

    // Requires TMDb API Key!
    if (TMDB_API_KEY === 'YOUR_TMDB_API_KEY') {
        hideLoading();
        showError("TMDB API Key required for Genre Search. Update the key in script.js!");
        return;
    }

    try {
        const res = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}`);
        const data = await res.json();
        hideLoading();

        if (data.results && data.results.length > 0) {
            renderMoviesFromTMDB(data.results);
        } else {
            showError("No movies found for this genre.");
        }
    } catch (err) {
        showError("TMDB Network Error.");
    }
}

function loadWishlist() {
    clearGrid('My Wishlist');
    document.querySelectorAll('.genre-item').forEach(i => i.classList.remove('active'));

    if (currentWishlist.length === 0) {
        emptyWishlistIndicator.classList.remove('hidden');
        return;
    }

    currentWishlist.forEach(movie => {
        // Construct standard uniform card object
        movieGrid.appendChild(createCardHTML({
            id: movie.id,
            title: movie.title,
            year: movie.year,
            poster: movie.poster,
            rating: 'Saved', // Just a string for UI
            source: movie.source
        }));
    });
}

/* ============================
   GRID RENDERING
   ============================ */

function renderMoviesFromOMDB(movies) {
    if (!movies) return;
    movies.forEach(item => {
        if (item.Poster === "N/A") return; // skip missing posters
        movieGrid.appendChild(createCardHTML({
            id: item.imdbID,
            title: item.Title,
            year: item.Year,
            poster: item.Poster,
            rating: 'IMDb',
            source: 'OMDB'
        }));
    });
}

function renderMoviesFromTMDB(movies) {
    if (!movies) return;
    movies.forEach(item => {
        if (!item.poster_path) return;
        movieGrid.appendChild(createCardHTML({
            id: item.id,
            title: item.title,
            year: item.release_date ? item.release_date.split('-')[0] : 'N/A',
            poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
            rating: item.vote_average ? item.vote_average.toFixed(1) : 'N/A',
            source: 'TMDB'
        }));
    });
}

// Generate HTML Node for a generic uniform card
function createCardHTML(movie) {
    const isSaved = currentWishlist.some(m => m.id === movie.id);
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
        <img class="card-poster" src="${movie.poster}" alt="${movie.title}">
        <div class="card-overlay">
            <h3 class="card-title">${movie.title}</h3>
            <div class="card-meta">
                <span>${movie.year}</span>
                <span class="rating-badge"><i class="fas fa-star"></i> ${movie.rating}</span>
            </div>
            <button class="btn-wishlist-sm ${isSaved ? 'in-wishlist' : ''}" data-id="${movie.id}">
                ${isSaved ? '<i class="fas fa-check"></i> Saved' : '<i class="fas fa-heart"></i> Add to List'}
            </button>
        </div>
    `;

    // Click on Card -> Open Detail Modal
    card.addEventListener('click', (e) => {
        // Avoid opening modal if wishlist button is clicked
        if (e.target.closest('.btn-wishlist-sm')) return;
        openModalDetails(movie.id, movie.source);
    });

    // Handle Mini Wishlist Add
    const wishBtn = card.querySelector('.btn-wishlist-sm');
    wishBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleWishlist(movie, wishBtn);
    });

    return card;
}


/* ============================
   MODAL & FULL DETAILS (OMDB)
   ============================ */

async function openModalDetails(id, source) {
    // Show Modal empty while loading
    document.body.style.overflow = 'hidden';
    modal.classList.remove('hidden');
    videoContainer.classList.add('hidden');
    trailerError.classList.add('hidden');
    trailerLoading.classList.remove('hidden');

    // In advanced App, we use OMDB to fill in comprehensive Details via ID or Name
    try {
        // If source is TMDB, we might not have imdbID. But if we do OMDB, we do.
        // Let's force an OMDB search by TMDB Title (TMDB returns int IDs, OMDB string ttIds)
        let omdbQueryUrl = '';
        if (source === 'OMDB' || String(id).startsWith('tt')) {
            omdbQueryUrl = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${id}&plot=full`;
        } else {
            // Re-fetch from TMDB to get exact details + imdbID
            if (TMDB_API_KEY !== 'YOUR_TMDB_API_KEY') {
                const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}`);
                const tmdbData = await tmdbRes.json();
                if (tmdbData.imdb_id) {
                    omdbQueryUrl = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${tmdbData.imdb_id}&plot=full`;
                }
            }
        }

        if (omdbQueryUrl) {
            const res = await fetch(omdbQueryUrl);
            const data = await res.json();
            if (data.Response === "True") populateModalUI(data);
        }

        // Fetch Trailer concurrently
        fetchYouTubeTrailer(currentOpenedMovie.Title);

    } catch (err) {
        console.error(err);
    }
}

function populateModalUI(movie) {
    // Build object footprint for wishlist
    currentOpenedMovie = {
        id: movie.imdbID,
        title: movie.Title,
        year: movie.Year,
        poster: movie.Poster !== "N/A" ? movie.Poster : 'https://placehold.co/400x600/171717/a3a3a3?text=No+Poster',
        rating: movie.imdbRating,
        source: 'OMDB'
    };

    modalPoster.src = currentOpenedMovie.poster;
    modalTitle.textContent = movie.Title;
    modalRating.textContent = movie.imdbRating !== "N/A" ? movie.imdbRating : "N/A";
    modalYear.textContent = movie.Year;
    modalRuntime.textContent = movie.Runtime !== "N/A" ? movie.Runtime : "--";
    modalGenre.textContent = movie.Genre !== "N/A" ? movie.Genre : "Generic";
    modalPlot.textContent = movie.Plot !== "N/A" ? movie.Plot : "Plot description unavailable.";
    modalActors.textContent = movie.Actors !== "N/A" ? movie.Actors : "N/A";
    modalDirector.textContent = movie.Director !== "N/A" ? movie.Director : "N/A";
    modalWriter.textContent = movie.Writer !== "N/A" ? movie.Writer : "N/A";

    checkWishlistModalState();
}

closeModalBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto'; // restore scroll
    trailerIframe.src = ''; // Stop video playback
});

modalWishlistBtn.addEventListener('click', () => {
    toggleWishlist(currentOpenedMovie, null, true);
});


/* ============================
   YOUTUBE TRAILER API
   ============================ */

async function fetchYouTubeTrailer(title) {
    if (YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY') {
        trailerLoading.classList.add('hidden');
        trailerError.textContent = "YouTube API Key required for Trailers.";
        trailerError.classList.remove('hidden');
        return;
    }

    try {
        const query = `${title} official movie trailer`;
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();

        trailerLoading.classList.add('hidden');

        if (data.items && data.items.length > 0) {
            const videoId = data.items[0].id.videoId;
            trailerIframe.src = `https://www.youtube.com/embed/${videoId}`;
            videoContainer.classList.remove('hidden');
        } else {
            trailerError.textContent = "Trailer not found on YouTube.";
            trailerError.classList.remove('hidden');
        }
    } catch (err) {
        trailerLoading.classList.add('hidden');
        trailerError.textContent = "YouTube Network Error.";
        trailerError.classList.remove('hidden');
    }
}


/* ============================
   WISHLIST LOGIC
   ============================ */

function toggleWishlist(movieObj, btnElement = null, isModal = false) {
    const existsIndex = currentWishlist.findIndex(m => m.id === movieObj.id);

    if (existsIndex > -1) {
        // Remove logic
        currentWishlist.splice(existsIndex, 1);
        if (btnElement) {
            btnElement.classList.remove('in-wishlist');
            btnElement.innerHTML = '<i class="fas fa-heart"></i> Add to List';
        }
        showToast("Removed from Wishlist");
    } else {
        // Add logic
        currentWishlist.push(movieObj);
        if (btnElement) {
            btnElement.classList.add('in-wishlist');
            btnElement.innerHTML = '<i class="fas fa-check"></i> Saved';
        }
        showToast("Added to Wishlist");
    }

    // Save to device
    localStorage.setItem('movieWishlist', JSON.stringify(currentWishlist));
    updateWishlistCount();

    // Sync UI states if we triggered from Modal
    if (isModal) checkWishlistModalState();

    // Auto-refresh wishlist page if we are currently viewing it and removing items
    if (sectionTitle.textContent === 'My Wishlist' && existsIndex > -1) {
        loadWishlist();
    }
}

function checkWishlistModalState() {
    const exists = currentWishlist.some(m => m.id === currentOpenedMovie?.id);
    if (exists) {
        modalWishlistBtn.classList.add('active');
        modalWishlistText.textContent = "Remove from Wishlist";
    } else {
        modalWishlistBtn.classList.remove('active');
        modalWishlistText.textContent = "Add to Wishlist";
    }
}

function updateWishlistCount() {
    wishlistCount.textContent = currentWishlist.length;
}


/* ============================
   UTILITIES UI
   ============================ */

function clearGrid(newTitle) {
    movieGrid.innerHTML = '';
    errorIndicator.classList.add('hidden');
    emptyWishlistIndicator.classList.add('hidden');
    sectionTitle.textContent = newTitle;
}

function showLoading() { loadingIndicator.classList.remove('hidden'); }
function hideLoading() { loadingIndicator.classList.add('hidden'); }

function showError(msg) {
    hideLoading();
    errorText.textContent = msg;
    errorIndicator.classList.remove('hidden');
}

function showToast(msg) {
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${msg}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}
