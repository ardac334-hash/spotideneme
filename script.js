// Spotify App ayarları - BUNLARI DEĞİŞTİRMENİZ GEREKİYOR
        const client_id = "4f9325f881bf4c1e92b9e41c7fadc4ef";
        const redirect_uri = "https://ardac334-hash.github.io/spotideneme/index.html";
        const scopes = "user-top-read user-read-recently-played user-read-email";

        let accessToken = null;
        let userData = {};

        // Debug fonksiyonu
        function debugLog(message) {
            console.log(message);
            const debugElement = document.getElementById("debug-content");
            debugElement.innerHTML += "<br>" + new Date().toLocaleTimeString() + ": " + message;
        }

        // Sayfa yüklendiğinde
        document.addEventListener('DOMContentLoaded', function() {
            debugLog("DOM yüklendi");
            
            // Login butonu event listener'ı ekle
            const loginButton = document.getElementById("login");
            if (loginButton) {
                debugLog("Login butonu bulundu");
                loginButton.onclick = handleLogin;
            } else {
                debugLog("HATA: Login butonu bulunamadı!");
            }

            // URL'den token kontrol et
            checkForToken();
        });

        function handleLogin() {
            debugLog("Login butonuna tıklandı");
            
            const authUrl = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=token&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scopes)}`;
            
            debugLog("Yönlendirme URL'si: " + authUrl);
            
            try {
                window.location.href = authUrl;
            } catch (error) {
                debugLog("HATA: Yönlendirme başarısız - " + error.message);
            }
        }

        function checkForToken() {
            debugLog("Token kontrol ediliyor...");
            
            // URL hash kontrolü
            const hash = window.location.hash;
            debugLog("URL Hash: " + hash);
            
            if (hash) {
                const hashParams = hash.substring(1).split("&").reduce((res, item) => {
                    let parts = item.split("=");
                    res[parts[0]] = parts[1];
                    return res;
                }, {});
                
                debugLog("Hash parametreleri: " + JSON.stringify(hashParams));
                
                accessToken = hashParams.access_token;
                
                if (accessToken) {
                    debugLog("Access token bulundu: " + accessToken.substring(0, 20) + "...");
                    initializeApp();
                } else {
                    debugLog("Access token bulunamadı");
                }
            } else {
                debugLog("URL'de hash bulunamadı");
            }
        }

        async function initializeApp() {
            debugLog("Uygulama başlatılıyor...");
            
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
                
                debugLog("Uygulama başarıyla başlatıldı");
                
            } catch (error) {
                debugLog("HATA: Uygulama başlatılamadı - " + error.message);
                showError("Spotify verileri yüklenirken bir hata oluştu: " + error.message);
            }
        }

        async function fetchUserInfo() {
            debugLog("Kullanıcı bilgileri alınıyor...");
            
            const response = await fetch("https://api.spotify.com/v1/me", {
                headers: { "Authorization": "Bearer " + accessToken }
            });
            
            debugLog("Kullanıcı API yanıt kodu: " + response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                debugLog("API Hatası: " + errorText);
                throw new Error("Kullanıcı bilgileri alınamadı: " + response.status);
            }
            
            const user = await response.json();
            userData = user;
            
            debugLog("Kullanıcı bilgileri alındı: " + user.display_name);
            
            document.getElementById("user-name").textContent = user.display_name || "Spotify Kullanıcısı";
            document.getElementById("user-email").textContent = user.email || "E-posta gizli";
        }

        async function fetchTopTracks() {
            debugLog("En çok dinlenen şarkılar alınıyor...");
            
            try {
                const response = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=medium_term", {
                    headers: { "Authorization": "Bearer " + accessToken }
                });
                
                debugLog("Şarkılar API yanıt kodu: " + response.status);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    debugLog("Şarkılar API Hatası: " + errorText);
                    throw new Error("Şarkılar alınamadı: " + response.status);
                }
                
                const data = await response.json();
                debugLog("Şarkı sayısı: " + data.items.length);
                displayTracks(data.items, "tracks-content");
                
            } catch (error) {
                debugLog("Şarkı alma hatası: " + error.message);
                document.getElementById("tracks-content").innerHTML = '<p class="error">Şarkılar yüklenirken hata oluştu: ' + error.message + '</p>';
            }
        }

        async function fetchTopArtists() {
            debugLog("En sevilen sanatçılar alınıyor...");
            
            try {
                const response = await fetch("https://api.spotify.com/v1/me/top/artists?limit=20&time_range=medium_term", {
                    headers: { "Authorization": "Bearer " + accessToken }
                });
                
                if (!response.ok) throw new Error("Sanatçılar alınamadı: " + response.status);
                
                const data = await response.json();
                debugLog("Sanatçı sayısı: " + data.items.length);
                displayArtists(data.items, "artists-content");
                
            } catch (error) {
                debugLog("Sanatçı alma hatası: " + error.message);
                document.getElementById("artists-content").innerHTML = '<p class="error">Sanatçılar yüklenirken hata oluştu: ' + error.message + '</p>';
            }
        }

        async function fetchRecentTracks() {
            debugLog("Son dinlenenler alınıyor...");
            
            try {
                const response = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=20", {
                    headers: { "Authorization": "Bearer " + accessToken }
                });
                
                if (!response.ok) throw new Error("Son dinlenenler alınamadı: " + response.status);
                
                const data = await response.json();
                debugLog("Son dinlenen sayısı: " + data.items.length);
                displayRecentTracks(data.items, "recent-content");
                
            } catch (error) {
                debugLog("Son dinlenenler alma hatası: " + error.message);
                document.getElementById("recent-content").innerHTML = '<p class="error">Son dinlenenler yüklenirken hata oluştu: ' + error.message + '</p>';
            }
        }

        async function fetchStats() {
            debugLog("İstatistikler hesaplanıyor...");
            
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
                
                debugLog("İstatistik verileri alındı");
                displayStats(tracks.items, artists.items);
                
            } catch (error) {
                debugLog("İstatistik hatası: " + error.message);
                document.getElementById("stats-content").innerHTML = '<p class="error">İstatistikler yüklenirken hata oluştu: ' + error.message + '</p>';
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
            
            const topGenre = Object.keys(genreCount).length > 0 ? 
                Object.keys(genreCount).reduce((a, b) => genreCount[a] > genreCount[b] ? a : b) : 
                "Bilinmiyor";
            
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
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.innerHTML = message;
            document.querySelector('.container').appendChild(errorDiv);
        }
