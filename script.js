
        const client_id = "4f9325f881bf4c1e92b9e41c7fadc4ef";
        const redirect_uri = "https://ardac334-hash.github.io/spotideneme/";
        const scopes = "user-top-read user-read-recently-played user-read-email";

        let accessToken = null;
        let userData = {};

        // Giriş butonu
        document.getElementById("login").onclick = () => {
            window.location = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=token&redirect_uri=${redirect_uri}&scope=${scopes}`;
        }

        // URL'den token al
        const hash = window.location.hash.substring(1).split("&").reduce((res, item) => {
            let parts = item.split("=");
            res[parts[0]] = parts[1];
            return res;
        }, {});

        accessToken = hash.access_token;

        if (accessToken) {
            initializeApp();
        }

        async function initializeApp() {
            try {
                // Kullanıcı bilgilerini al
                await fetchUserInfo();
                
                // UI'ı göster
                document.getElementById("login").style.display = "none";
                document.getElementById("user-info").style.display = "block";
                document.getElementById("tabs").style.display = "flex";
                
                // Varsayılan olarak en çok dinlenen şarkıları yükle
                await fetchTopTracks();
                
                // Tab event listeners
                setupTabs();
                
            } catch (error) {
                showError("Spotify verileri yüklenirken bir hata oluştu.");
                console.error(error);
            }
        }

        async function fetchUserInfo() {
            const response = await fetch("https://api.spotify.com/v1/me", {
                headers: { "Authorization": "Bearer " + accessToken }
            });
            
            if (!response.ok) throw new Error("Kullanıcı bilgileri alınamadı");
            
            const user = await response.json();
            userData = user;
            
            document.getElementById("user-name").textContent = user.display_name || "Spotify Kullanıcısı";
            document.getElementById("user-email").textContent = user.email || "E-posta gizli";
        }

        async function fetchTopTracks() {
            try {
                const response = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=medium_term", {
                    headers: { "Authorization": "Bearer " + accessToken }
                });
                
                if (!response.ok) throw new Error("Şarkılar alınamadı");
                
                const data = await response.json();
                displayTracks(data.items, "tracks-content");
                
            } catch (error) {
                document.getElementById("tracks-content").innerHTML = '<p class="error">Şarkılar yüklenirken hata oluştu.</p>';
            }
        }

        async function fetchTopArtists() {
            try {
                const response = await fetch("https://api.spotify.com/v1/me/top/artists?limit=20&time_range=medium_term", {
                    headers: { "Authorization": "Bearer " + accessToken }
                });
                
                if (!response.ok) throw new Error("Sanatçılar alınamadı");
                
                const data = await response.json();
                displayArtists(data.items, "artists-content");
                
            } catch (error) {
                document.getElementById("artists-content").innerHTML = '<p class="error">Sanatçılar yüklenirken hata oluştu.</p>';
            }
        }

        async function fetchRecentTracks() {
            try {
                const response = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=20", {
                    headers: { "Authorization": "Bearer " + accessToken }
                });
                
                if (!response.ok) throw new Error("Son dinlenenler alınamadı");
                
                const data = await response.json();
                displayRecentTracks(data.items, "recent-content");
                
            } catch (error) {
                document.getElementById("recent-content").innerHTML = '<p class="error">Son dinlenenler yüklenirken hata oluştu.</p>';
            }
        }

        async function fetchStats() {
            try {
                // Paralel olarak verileri al
                const [tracksResponse, artistsResponse] = await Promise.all([
                    fetch("https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term", {
                        headers: { "Authorization": "Bearer " + accessToken }
                    }),
                    fetch("https://api.spotify.com/v1/me/top/artists?limit=50&time_range=medium_term", {
                        headers: { "Authorization": "Bearer " + accessToken }
                    })
                ]);
                
                const tracks = await tracksResponse.json();
                const artists = await artistsResponse.json();
                
                displayStats(tracks.items, artists.items);
                
            } catch (error) {
                document.getElementById("stats-content").innerHTML = '<p class="error">İstatistikler yüklenirken hata oluştu.</p>';
            }
        }

        function displayTracks(tracks, containerId) {
            let html = "";
            tracks.forEach((track, index) => {
                html += `
                    <div class="track-item">
                        <div class="track-name">${index + 1}. ${track.name}</div>
                        <div class="track-artist">👤 ${track.artists.map(a => a.name).join(", ")}</div>
                        <div class="track-album">💿 ${track.album.name}</div>
                    </div>
                `;
            });
            document.getElementById(containerId).innerHTML = html;
        }

        function displayArtists(artists, containerId) {
            let html = "";
            artists.forEach((artist, index) => {
                html += `
                    <div class="artist-item">
                        <div class="artist-name">${index + 1}. ${artist.name}</div>
                        <div class="artist-genres">🎭 ${artist.genres.join(", ") || "Tür bilgisi yok"}</div>
                    </div>
                `;
            });
            document.getElementById(containerId).innerHTML = html;
        }

        function displayRecentTracks(items, containerId) {
            let html = "";
            items.forEach(item => {
                const track = item.track;
                const playedAt = new Date(item.played_at).toLocaleString('tr-TR');
                html += `
                    <div class="track-item">
                        <div class="track-name">${track.name}</div>
                        <div class="track-artist">👤 ${track.artists.map(a => a.name).join(", ")}</div>
                        <div class="track-album">🕒 ${playedAt}</div>
                    </div>
                `;
            });
            document.getElementById(containerId).innerHTML = html;
        }

        function displayStats(tracks, artists) {
            // Temel istatistikler hesapla
            const uniqueArtists = new Set(tracks.flatMap(track => track.artists.map(a => a.name)));
            const genres = artists.flatMap(artist => artist.genres);
            const genreCount = {};
            genres.forEach(genre => {
                genreCount[genre] = (genreCount[genre] || 0) + 1;
            });
            
            const topGenre = Object.keys(genreCount).reduce((a, b) => genreCount[a] > genreCount[b] ? a : b, "Bilinmiyor");
            
            const html = `
                <div class="stat-card">
                    <div class="stat-number">${tracks.length}</div>
                    <div class="stat-label">En Çok Dinlenen Şarkı</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${uniqueArtists.size}</div>
                    <div class="stat-label">Farklı Sanatçı</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${artists.length}</div>
                    <div class="stat-label">Favori Sanatçı</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${topGenre}</div>
                    <div class="stat-label">En Sevilen Tür</div>
                </div>
            `;
            
            document.getElementById("stats-content").innerHTML = html;
        }

        function setupTabs() {
            const tabs = document.querySelectorAll('.tab');
            const sections = document.querySelectorAll('.content-section');
            
            tabs.forEach(tab => {
                tab.addEventListener('click', async () => {
                    // Aktif tab'ı değiştir
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    
                    // Aktif section'ı değiştir
                    sections.forEach(s => s.classList.remove('active'));
                    const sectionId = tab.getAttribute('data-section');
                    document.getElementById(sectionId).classList.add('active');
                    
                    // Gerekli verileri yükle
                    switch(sectionId) {
                        case 'top-artists':
                            if (document.getElementById('artists-content').innerHTML.includes('yükleniyor')) {
                                await fetchTopArtists();
                            }
                            break;
                        case 'recent-tracks':
                            if (document.getElementById('recent-content').innerHTML.includes('yükleniyor')) {
                                await fetchRecentTracks();
                            }
                            break;
                        case 'stats':
                            if (document.getElementById('stats-content').innerHTML.includes('hesaplanıyor')) {
                                await fetchStats();
                            }
                            break;
                    }
                });
            });
        }

        function showError(message) {
            document.getElementById("results").innerHTML = `<p class="error">${message}</p>`;
        }
    </script>
