import { ROOM_2024 } from './memories/2024.js';
import { ROOM_2025 } from './memories/2025.js';
import { ROOM_2026 } from './memories/2026.js';

/**
 * ==========================================================
 *  KONFIGURASI UTAMA ULANG TAHUN & DAFTAR RUANGAN
 * ==========================================================
 *  Foto & cerita tiap tahun sudah dipisahkan di:
 *   - js/memories/2024.js  (folder foto: assets/photos/2024/)
 *   - js/memories/2025.js  (folder foto: assets/photos/2025/)
 *   - js/memories/2026.js  (folder foto: assets/photos/2026/)
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

export const ROOMS = [ROOM_2024, ROOM_2025, ROOM_2026];
