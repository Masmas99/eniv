/**
 * ==========================================================
 *  DATA MUSEUM — EDIT DI SINI
 * ==========================================================
 *  BIRTHDAY : info ulang tahun, musik YouTube, pesan sambutan & surat
 *  ROOMS    : 3 ruangan (2024, 2025, 2026) × 10 foto = 30 kenangan
 *
 *  Cara mengganti foto:
 *   1. Taruh foto di folder `assets/photos/`
 *   2. Isi field `image`, misal: `image: 'assets/photos/2024-01.jpg'`
 *      (Selama file belum ada atau `image: ''`, bingkai otomatis
 *       menampilkan lukisan ilustrasi yang cantik.)
 */

export const BIRTHDAY = {
  herName: 'Sayang',              // nama pacar
  fromName: 'Aku',                // nama kamu
  date: '24 Oktober 2026',
  candles: 5,                     // jumlah lilin di kue ulang tahun

  // Musik latar dari YouTube: https://youtu.be/hDU4GB1PTxc
  youtubeId: 'hDU4GB1PTxc',
  music: '',                      // opsional: isi 'assets/music.mp3' jika mau pakai file lokal

  welcome: {
    title: 'Selamat Datang ❤',
    body:
      'Hai sayang,\n\nSelamat datang di museum kecil yang aku bangun khusus untuk ulang tahunmu. ' +
      'Di dalamnya ada tiga ruangan — 2024, 2025, dan 2026 — masing-masing menyimpan 10 kenangan kita.\n\n' +
      'Jalan pelan-pelan ya, buka setiap bingkainya. Di ujung ruangan 2026 ada sesuatu yang menunggumu. 🎂',
  },

  letter: {
    title: 'Selamat Ulang Tahun, Sayang 🎉',
    body:
      'Terima kasih sudah menjadi bagian terbaik dari tiga tahun terakhir hidupku.\n\n' +
      'Dari canggung di pertemuan pertama, sampai hari ini — semua terasa lebih indah karena ada kamu.\n\n' +
      'Semoga di umur yang baru ini kamu selalu sehat, bahagia, dan semua mimpimu satu per satu jadi nyata. ' +
      'Aku akan selalu ada di sampingmu untuk menyemangati.\n\n' +
      'Aku sayang kamu, hari ini dan seterusnya.\n\n— Aku',
  },
};

export const ROOMS = [
  /* ========================================================
   *  RUANG 2024 — 10 KENANGAN
   * ======================================================== */
  {
    year: '2024',
    title: 'Awal Cerita Kita',
    subtitle: 'Saat semuanya dimulai',
    theme: { wall: '#3a2b33', rug: '#7a2840', accent: '#ff8fab' },
    memories: [
      {
        title: 'Pertama Kali Bertemu',
        date: 'Januari 2024',
        description: 'Hari itu biasa saja, sampai kamu datang dan menyapa. Siapa sangka satu senyuman bisa mengubah segalanya.',
        image: 'assets/photos/2024-01.jpg', icon: '👋', palette: ['#ff9a9e', '#fad0c4'],
      },
      {
        title: 'Chat Sampai Subuh',
        date: 'Februari 2024',
        description: 'Obrolan yang awalnya cuma "lagi apa?" berubah jadi cerita sampai matahari terbit. Besoknya sama-sama ngantuk tapi senang.',
        image: 'assets/photos/2024-02.jpg', icon: '📱', palette: ['#a18cd1', '#fbc2eb'],
      },
      {
        title: 'Kencan Pertama',
        date: 'Maret 2024',
        description: 'Gugup memilih baju, gugup memilih tempat makan, dan akhirnya lupa semua karena kita terlalu asyik ngobrol.',
        image: 'assets/photos/2024-03.jpg', icon: '🍜', palette: ['#f6d365', '#fda085'],
      },
      {
        title: 'Foto Pertama Berdua',
        date: 'April 2024',
        description: 'Masih malu-malu waktu minta foto bareng. Sekarang foto itu jadi salah satu yang paling sering aku lihat.',
        image: 'assets/photos/2024-04.jpg', icon: '📸', palette: ['#fbc2eb', '#a6c1ee'],
      },
      {
        title: 'Nonton Bioskop Pertama',
        date: 'Mei 2024',
        description: 'Filmnya apa sudah agak lupa, tapi deg-degannya duduk sebelahan sama kamu masih ingat jelas.',
        image: 'assets/photos/2024-05.jpg', icon: '🍿', palette: ['#667eea', '#764ba2'],
      },
      {
        title: 'Resmi Jadian',
        date: 'Juni 2024',
        description: 'Kalimat yang sudah dilatih berkali-kali tetap keluar berantakan. Tapi kamu bilang "iya", dan itu yang paling penting.',
        image: 'assets/photos/2024-06.jpg', icon: '💞', palette: ['#ff6a88', '#ff99ac'],
      },
      {
        title: 'Jalan Sore Tanpa Tujuan',
        date: 'Agustus 2024',
        description: 'Keliling kota naik motor sambil menikmati angin sore dan beli jajanan pinggir jalan.',
        image: 'assets/photos/2024-07.jpg', icon: '🛵', palette: ['#ff9966', '#ff5e62'],
      },
      {
        title: 'Kejutan Kecil Untukmu',
        date: 'September 2024',
        description: 'Bunga sederhana yang kusembunyikan di belakang punggung. Melihat ekspresi kagetmu bikin hariku lengkap.',
        image: 'assets/photos/2024-08.jpg', icon: '💐', palette: ['#f093fb', '#f5576c'],
      },
      {
        title: 'Kopi & Cerita Malam',
        date: 'November 2024',
        description: 'Dua gelas minuman hangat di sudut kafe, saling cerita tentang masa kecil dan mimpi masing-masing.',
        image: 'assets/photos/2024-09.jpg', icon: '☕', palette: ['#c79081', '#dfa579'],
      },
      {
        title: 'Malam Tahun Baru Pertama',
        date: 'Desember 2024',
        description: 'Kembang api pertama yang kita lihat berdua. Hitungan mundur terasa lebih hangat saat tanganmu kugenggam.',
        image: 'assets/photos/2024-10.jpg', icon: '🎆', palette: ['#30cfd0', '#330867'],
      },
    ],
  },

  /* ========================================================
   *  RUANG 2025 — 10 KENANGAN
   * ======================================================== */
  {
    year: '2025',
    title: 'Tumbuh Bersama',
    subtitle: 'Belajar saling memahami',
    theme: { wall: '#25323a', rug: '#1f4e5f', accent: '#7fd1c7' },
    memories: [
      {
        title: 'Awal Tahun Berdua',
        date: 'Januari 2025',
        description: 'Memulai tahun baru dengan daftar tempat yang ingin kita kunjungi bersama.',
        image: 'assets/photos/2025-01.jpg', icon: '🗓️', palette: ['#89f7fe', '#66a6ff'],
      },
      {
        title: 'Hari Kasih Sayang',
        date: 'Februari 2025',
        description: 'Cokelat manis dan surat tulisan tangan yang masih tersimpan rapi sampai sekarang.',
        image: 'assets/photos/2025-02.jpg', icon: '🍫', palette: ['#ff758c', '#ff7eb3'],
      },
      {
        title: 'Liburan Pertama Berdua',
        date: 'Maret 2025',
        description: 'Tiket kereta, koper kecil, dan rencana yang berantakan. Justru tersesat bersamamu jadi bagian paling seru.',
        image: 'assets/photos/2025-03.jpg', icon: '🚆', palette: ['#43cea2', '#185a9d'],
      },
      {
        title: 'Kulineran Malam',
        date: 'April 2025',
        description: 'Berburu makanan kaki lima favorit sampai kenyang dan tertawa sepanjang jalan pulang.',
        image: 'assets/photos/2025-04.jpg', icon: '🍢', palette: ['#f7971e', '#ffd200'],
      },
      {
        title: 'Hujan & Payung Kecil',
        date: 'Mei 2025',
        description: 'Satu payung untuk berdua, bahu kanan basah kuyup. Tapi aku tidak keberatan sama sekali.',
        image: 'assets/photos/2025-05.jpg', icon: '☔', palette: ['#536976', '#bbd2c5'],
      },
      {
        title: 'Anniversary Pertama',
        date: 'Juni 2025',
        description: 'Setahun penuh tawa, sedikit pertengkaran kecil, dan banyak sekali pelukan. Terima kasih sudah bertahan.',
        image: 'assets/photos/2025-06.jpg', icon: '🎂', palette: ['#ee9ca7', '#ffdde1'],
      },
      {
        title: 'Piknik di Taman',
        date: 'Juli 2025',
        description: 'Tikar kecil di bawah pohon rindang, bekal buatan sendiri, dan langit biru yang cerah.',
        image: 'assets/photos/2025-07.jpg', icon: '🧺', palette: ['#56ab2f', '#a8e063'],
      },
      {
        title: 'Masak Bareng',
        date: 'Agustus 2025',
        description: 'Dapur berantakan, nasi sedikit gosong, tapi itu makan malam terenak yang pernah kita buat.',
        image: 'assets/photos/2025-08.jpg', icon: '🍳', palette: ['#ff8008', '#ffc837'],
      },
      {
        title: 'Konser Musik Berdua',
        date: 'Oktober 2025',
        description: 'Menyanyikan lagu favorit kita keras-keras di tengah keramaian sambil berpegangan tangan.',
        image: 'assets/photos/2025-09.jpg', icon: '🎸', palette: ['#8e2de2', '#4a00e0'],
      },
      {
        title: 'Menutup 2025 Bersamamu',
        date: 'Desember 2025',
        description: 'Satu tahun lagi terlewati. Semakin kenal kamu, semakin yakin kalau kamu orangnya.',
        image: 'assets/photos/2025-10.jpg', icon: '✨', palette: ['#2b5876', '#4e4376'],
      },
    ],
  },

  /* ========================================================
   *  RUANG 2026 — 10 KENANGAN
   * ======================================================== */
  {
    year: '2026',
    title: 'Hari Ini & Selamanya',
    subtitle: 'Dan cerita kita masih berlanjut',
    theme: { wall: '#3a3024', rug: '#6b4a1f', accent: '#ffd27f' },
    memories: [
      {
        title: 'Harapan Baru di 2026',
        date: 'Januari 2026',
        description: 'Tahun baru dengan semangat baru, tapi masih dengan orang favorit yang sama di sebelahku.',
        image: 'assets/photos/2026-01.jpg', icon: '🌅', palette: ['#ff7e5f', '#feb47b'],
      },
      {
        title: 'Senja di Pantai',
        date: 'Februari 2026',
        description: 'Langit oranye, suara ombak pelan, dan kamu yang bersandar di bahuku. Waktu seolah berhenti sebentar.',
        image: 'assets/photos/2026-02.jpg', icon: '🏖️', palette: ['#f857a6', '#ff5858'],
      },
      {
        title: 'Photobox Lucu Kita',
        date: 'Maret 2026',
        description: 'Empat pose konyol dalam satu strip foto yang selalu bikin senyum setiap kali dilihat.',
        image: 'assets/photos/2026-03.jpg', icon: '🎞️', palette: ['#a1c4fd', '#c2e9fb'],
      },
      {
        title: 'Mimpi yang Kita Tulis',
        date: 'April 2026',
        description: 'Kita menulis daftar mimpi di selembar kertas. Beberapa sudah tercoret, sisanya akan kita kejar bersama.',
        image: 'assets/photos/2026-04.jpg', icon: '📝', palette: ['#c79081', '#dfa579'],
      },
      {
        title: 'Perjalanan ke Pegunungan',
        date: 'Mei 2026',
        description: 'Udara dingin, jaket tebal, dan pemandangan kabut pagi yang kita nikmati sambil minum cokelat hangat.',
        image: 'assets/photos/2026-05.jpg', icon: '⛰️', palette: ['#11998e', '#38ef7d'],
      },
      {
        title: 'Dua Tahun Kita',
        date: 'Juni 2026',
        description: 'Dua tahun bersama, dan aku masih jatuh cinta dengan cara yang sama setiap harinya.',
        image: 'assets/photos/2026-06.jpg', icon: '💍', palette: ['#8e2de2', '#4a00e0'],
      },
      {
        title: 'Saling Menyemangati',
        date: 'Juli 2026',
        description: 'Di hari-hari yang melelahkan, pulang dan mendengar suaramu selalu jadi obat paling ampuh.',
        image: 'assets/photos/2026-07.jpg', icon: '🤍', palette: ['#d4fc79', '#96e6a1'],
      },
      {
        title: 'Tawa Paling Lepas',
        date: 'Agustus 2026',
        description: 'Hal-hal receh yang cuma kita berdua yang mengerti, tapi bisa bikin ketawa sampai sakit perut.',
        image: 'assets/photos/2026-08.jpg', icon: '😄', palette: ['#f6d365', '#fda085'],
      },
      {
        title: 'Menuju Hari Spesialmu',
        date: 'September 2026',
        description: 'Diam-diam menyiapkan kejutan kecil ini sambil membayangkan senyummu saat melihatnya.',
        image: 'assets/photos/2026-09.jpg', icon: '🤫', palette: ['#cd9cf2', '#f6f3ff'],
      },
      {
        title: 'Selamat Ulang Tahun!',
        date: '24 Oktober 2026',
        description: 'Hari ini adalah hari spesialmu. Terus berjalan ke ujung ruangan ini ya — ada kue ulang tahun yang menunggu untuk kamu tiup. 🎂',
        image: 'assets/photos/2026-10.jpg', icon: '🎁', palette: ['#ff9a9e', '#fecfef'],
      },
    ],
  },
];
