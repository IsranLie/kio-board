# Kio Board

Aplikasi papan **Kanban** berbasis web yang dibangun dengan **Ionic + Vue 3 + TypeScript**. State board disimpan secara lokal menggunakan `@ionic/storage`.

## Fitur

- **Board Kanban**: kelola kolom/list dan kartu tugas.
- **Drag & drop**: pindahkan kartu antar kolom atau ubah urutan kartu dalam kolom.
- **Manajemen list/kolom**: tambah list baru, hapus kolom (dengan konfirmasi).
- **Manajemen tugas**: tambah, buka/detail, dan hapus tugas (dengan konfirmasi & toast).
- **Pencarian & filter**: cari tugas dan filter berdasarkan label/tag.
- **Modal UI**: Invite/Share, ubah visibility board, serta Export/Import board (JSON).
- **Responsif**: header menyesuaikan layar kecil dengan menu hamburger.
- **Preloader**: tampilan loading saat aplikasi dimuat/dihidrasi.

## Teknologi

- [Ionic Vue](https://ionicframework.com/docs/vue/overview) & Vue 3
- TypeScript, Vite
- Vue Router
- `@ionic/storage` untuk persistensi data lokal
- Capacitor (konfigurasi mobile)

## Prasyarat

- Node.js dan npm

## Menjalankan proyek

```bash
# instal dependensi
npm install

# jalankan development server
npm run dev

# atau
ionic serve

# build produksi (type-check + Vite build)
npm run build

# pratinjau hasil build
npm run preview
```

## Skrip lain

```bash
# lint (ESLint, typecheck e2e, Prettier check)
npm run lint

# perbaiki lint/format
npm run lint:fix

# unit test (Vitest)
npm run test:unit

# e2e test (Playwright)
npm run test:e2e

# semua test
npm test
```

## Struktur singkat

- `src/views/` — halaman (mis. `KanbanPage.vue`)
- `src/components/kanban/` — komponen board, kolom, kartu
- `src/components/ui/` — komponen UI/modal/dialog
- `src/stores/storage.ts` — state board, persistensi, dan mutasi data
- `src/types/` — tipe data Kanban

## Preview
https://kio-board.vercel.app/
<img width="1365" height="651" alt="image" src="https://github.com/user-attachments/assets/3a101fa1-f26d-4426-9651-a49d0a184a04" />
