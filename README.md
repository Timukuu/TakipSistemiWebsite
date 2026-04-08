# MEB Oyun Uretim Takip Sistemi

MEB Oyun Uretim Takip Sistemi, egitsel oyunlarin ders, konu ve uretim asamasi bazinda izlenebilmesi icin hazirlanmis Faz 1 statik operasyon panelidir. Arayuz, `Maxton` temasinin `admin/vertical-menu` varyantindan uyarlanmistir; veri kaynagi repo icindeki JSON dosyalaridir.

## Ozellikler

- React + Vite tabanli tek sayfa operasyon paneli
- Maxton tasarimina uyarlanmis sidebar, header, dashboard kartlari ve tablo duzeni
- `data/users.json`, `data/subjects.json`, `data/games.json` dosyalarindan veri okuma
- Rol simulasyonu: yonetici ve ders sorumlusu gorunumu
- Dashboard ozeti: toplam oyun, tamamlanan kayit, aktif kayit, onay bekleyen asama
- Filtrelenebilir oyun listesi: ders, durum, tamamlanma ve konu aramasi
- Oyun detay / duzenleme paneli: Faz 2 kalici veri akisina hazir form iskeleti
- GitHub Pages uyumlu deploy workflow

## Klasor Yapisi

```text
/src          React uygulamasi
/data         JSON veri kaynaklari
/public/theme Maxton temasindan tasinan aktif stil ve gorseller
/maxton       Ham tema kaynagi
```

## Gelistirme

```bash
npm install
npm run dev
```

## Uretim Build

```bash
npm run build
npm run preview
```

## Veri Guncelleme Akisi

Bu Faz 1 surumunde panel uzerinden yapilan duzenlemeler repo verisine kalici olarak yazilmaz. Kalici guncelleme akisi:

1. `data/*.json` dosyalarini duzenleyin.
2. Degisiklikleri commit edin.
3. Repoya push edin.
4. GitHub Actions, GitHub Pages yayinini guncellesin.

## GitHub Pages

`.github/workflows/deploy.yml` dosyasi, varsayilan olarak Vite build ciktisini GitHub Pages artifact'i olarak yukler ve yayina alir. Repo ayarlarinda Pages kaynagi olarak **GitHub Actions** secilmelidir.
