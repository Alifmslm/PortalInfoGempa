document.addEventListener('DOMContentLoaded', function() {
    const map = L.map('map').setView([-0.789, 113.921], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const markerGroup = L.layerGroup().addTo(map);
    const tbodyContainer = document.getElementById('gempa-tbody');
    let arrayMarker = [];

    const apiBMKG = {
        terkini: 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json',
        m5: 'https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json',
        dirasakan: 'https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json'
    };

    async function fetchGempa(kategori) {
        try {
            tbodyContainer.innerHTML = '<tr><td colspan="7" class="text-slate-500 text-center py-8">Memuat data gempa dari BMKG...</td></tr>';
            markerGroup.clearLayers(); 

            const response = await fetch(apiBMKG[kategori]);
            if (!response.ok) throw new Error('Respons jaringan bermasalah');
            
            const data = await response.json();
            let dataGempa = data.Infogempa.gempa;

            if (!Array.isArray(dataGempa)) {
                dataGempa = [dataGempa];
            }

            renderDaftarGempa(dataGempa);

        } catch (error) {
            console.error("Gagal mengambil data:", error);
            tbodyContainer.innerHTML = '<tr><td colspan="7" class="text-red-500 text-center py-8">Gagal memuat data. Silakan periksa koneksi internet.</td></tr>';
        }
    }

    function renderDaftarGempa(arrayGempa) {
        tbodyContainer.innerHTML = ''; 
        arrayMarker = [];

        arrayGempa.forEach((gempa, index) => {
            const coords = gempa.Coordinates.split(',');
            const lat = parseFloat(coords[0]);
            const lng = parseFloat(coords[1]);

            const marker = L.marker([lat, lng]).addTo(markerGroup);
            marker.bindPopup(`
                <div class="text-center font-sans">
                    <strong class="text-lg text-blue-900">Mag ${gempa.Magnitude}</strong><br>
                    <span class="text-xs text-gray-600">${gempa.Tanggal}, ${gempa.Jam}</span><br>
                    <span class="text-sm font-medium mt-1 block">${gempa.Wilayah}</span>
                </div>
            `);
            arrayMarker.push(marker);

            const magnitudoFormat = gempa.Magnitude.replace('.', ',');

            const trHTML = `
                <tr class="hover:bg-slate-50 transition duration-150">
                    <td class="p-4 text-center text-slate-500">${index + 1}</td>
                    <td class="p-4">
                        <div class="text-slate-800">${gempa.Tanggal}</div>
                        <div class="text-xs text-slate-500 mt-0.5">${gempa.Jam}</div>
                    </td>
                    <td class="p-4 text-center text-slate-800">${magnitudoFormat}</td>
                    <td class="p-4 text-center">${gempa.Kedalaman}</td>
                    <td class="p-4 text-center text-xs text-slate-600">${gempa.Lintang} - ${gempa.Bujur}</td>
                    <td class="p-4 min-w-[250px] leading-snug">${gempa.Wilayah}</td>
                </tr>
            `;
            tbodyContainer.insertAdjacentHTML('beforeend', trHTML);
        });

        if (arrayMarker.length > 0) {
            if (arrayMarker.length === 1) {
                const pos = arrayMarker[0].getLatLng();
                map.setView([pos.lat, pos.lng], 6);
                arrayMarker[0].openPopup();
            } else {
                const groupBounds = new L.featureGroup(arrayMarker);
                map.fitBounds(groupBounds.getBounds(), { padding: [30, 30], maxZoom: 6 });
            }
        }
    }

    tbodyContainer.addEventListener('click', function(e) {
        const btn = e.target.closest('.btn-lihat');
        
        if (btn) {
            const index = parseInt(btn.getAttribute('data-index'));
            const lat = parseFloat(btn.getAttribute('data-lat'));
            const lng = parseFloat(btn.getAttribute('data-lng'));

            map.setView([lat, lng], 8);
            
            arrayMarker[index].openPopup();

            document.getElementById('map').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });

    const btnTerkini = document.getElementById('btn-terkini');
    const btnM5 = document.getElementById('btn-m5');
    const btnDirasakan = document.getElementById('btn-dirasakan');
    const semuaTombol = [btnTerkini, btnM5, btnDirasakan];

    function setTombolAktif(tombolAktif) {
        semuaTombol.forEach(btn => {
            btn.className = "px-4 py-2 text-sm font-medium rounded-md text-slate-600 hover:text-brand hover:bg-slate-50 transition whitespace-nowrap";
        });
        tombolAktif.className = "px-4 py-2 text-sm font-medium rounded-md bg-white text-brand shadow-sm border border-slate-200 whitespace-nowrap";
    }

    btnTerkini.addEventListener('click', () => { setTombolAktif(btnTerkini); fetchGempa('terkini'); });
    btnM5.addEventListener('click', () => { setTombolAktif(btnM5); fetchGempa('m5'); });
    btnDirasakan.addEventListener('click', () => { setTombolAktif(btnDirasakan); fetchGempa('dirasakan'); });

    fetchGempa('terkini');
});