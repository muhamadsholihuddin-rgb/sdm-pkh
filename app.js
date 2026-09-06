// ==================================================================
// Pemanggil API ke Apps Script.
// Dikirim sebagai Content-Type: text/plain supaya browser TIDAK
// mengirim "preflight request" (OPTIONS) lebih dulu — Apps Script Web App
// tidak menangani preflight itu dengan baik, jadi ini trik standar
// supaya request dari domain lain (Vercel) tetap bisa diterima.
// ==================================================================
function apiCall(action, params) {
  return fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: action, params: params || {} }),
  })
    .then((res) => res.json())
    .catch((err) => ({ success: false, message: "Gagal terhubung ke server: " + err.message }));
}

let currentToken = null;

// ---------- Inisialisasi halaman ----------
window.onload = function () {
  currentToken = localStorage.getItem("pkh_token");
  if (currentToken) {
    apiCall("checkSession", { token: currentToken }).then((res) => {
      if (res.valid) {
        loadMyData();
      } else {
        localStorage.removeItem("pkh_token");
        showScreen("loginScreen");
      }
    });
  } else {
    showScreen("loginScreen");
  }
};

function showScreen(id) {
  ["loadingScreen", "loginScreen", "changePasswordScreen", "appScreen"].forEach(function (s) {
    document.getElementById(s).classList.toggle("hidden", s !== id);
  });
}

function showMsg(elId, text, type) {
  document.getElementById(elId).innerHTML = '<div class="msg ' + type + '">' + text + "</div>";
}

// ---------- LOGIN ----------
function doLogin() {
  const nip = document.getElementById("loginNip").value.trim();
  const password = document.getElementById("loginPassword").value;
  if (!nip || !password) {
    showMsg("loginMsg", "NIP dan password wajib diisi.", "error");
    return;
  }
  apiCall("login", { nip: nip, password: password }).then((res) => {
    if (!res.success) {
      showMsg("loginMsg", res.message, "error");
      return;
    }
    currentToken = res.token;
    localStorage.setItem("pkh_token", currentToken);
    if (res.mustChangePassword) {
      showScreen("changePasswordScreen");
    } else {
      loadMyData();
    }
  });
}

// ---------- GANTI PASSWORD ----------
function doChangePassword() {
  const p1 = document.getElementById("newPassword1").value;
  const p2 = document.getElementById("newPassword2").value;
  if (p1 !== p2) {
    showMsg("changePasswordMsg", "Password tidak sama.", "error");
    return;
  }
  apiCall("changePassword", { token: currentToken, newPassword: p1 }).then((res) => {
    if (!res.success) {
      showMsg("changePasswordMsg", res.message, "error");
      return;
    }
    loadMyData();
  });
}

// ---------- LOGOUT ----------
function doLogout() {
  apiCall("logout", { token: currentToken });
  localStorage.removeItem("pkh_token");
  currentToken = null;
  document.getElementById("loginNip").value = "";
  document.getElementById("loginPassword").value = "";
  showScreen("loginScreen");
}

// ---------- MUAT DATA SETELAH LOGIN ----------
function loadMyData() {
  showScreen("loadingScreen");
  apiCall("getMyData", { token: currentToken }).then((res) => {
    if (!res.success) {
      localStorage.removeItem("pkh_token");
      showScreen("loginScreen");
      return;
    }
    const d = res.data;
    document.getElementById("namaUser").innerText = d.nama;
    document.getElementById("nipUser").innerText = d.nip;
    document.getElementById("fEmail").value = d.email;
    document.getElementById("fNoHp").value = d.noHp;
    document.getElementById("fKontakDaruratNama").value = d.kontakDaruratNama;
    document.getElementById("fKontakDaruratHp").value = d.kontakDaruratHp;
    document.getElementById("fAkunFb").value = d.akunFb;
    document.getElementById("fAkunIg").value = d.akunIg;
    document.getElementById("fAkunThreads").value = d.akunThreads;
    document.getElementById("fAkunX").value = d.akunX;
    document.getElementById("fAkunTelegram").value = d.akunTelegram;

    document.getElementById("keluargaList").innerHTML = "";
    (d.keluarga || []).forEach(addKeluargaRow);

    document.getElementById("wilayahList").innerHTML = "";
    (d.wilayah || []).forEach(addWilayahRow);

    showScreen("appScreen");
  });
}

// ---------- TABS ----------
function showTab(tabId, btnEl) {
  document.querySelectorAll(".tab-content").forEach((el) => el.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach((el) => el.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");
  const btn = btnEl || document.getElementById("navBtn-" + tabId);
  if (btn) btn.classList.add("active");
}

// ---------- PWA: registrasi service worker (biar bisa dipakai offline shell-nya) ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

// ---------- SIMPAN IDENTITAS ----------
function doSaveIdentitas() {
  const data = {
    email: document.getElementById("fEmail").value,
    noHp: document.getElementById("fNoHp").value,
    kontakDaruratNama: document.getElementById("fKontakDaruratNama").value,
    kontakDaruratHp: document.getElementById("fKontakDaruratHp").value,
    akunFb: document.getElementById("fAkunFb").value,
    akunIg: document.getElementById("fAkunIg").value,
    akunThreads: document.getElementById("fAkunThreads").value,
    akunX: document.getElementById("fAkunX").value,
    akunTelegram: document.getElementById("fAkunTelegram").value,
  };
  apiCall("saveIdentitas", { token: currentToken, data: data }).then((res) => {
    showMsg("identitasMsg", res.success ? "Tersimpan." : "Gagal: " + res.message, res.success ? "success" : "error");
  });
}

// ---------- KELUARGA (dinamis) ----------
function addKeluargaRow(existing) {
  existing = existing || { status: "Pasangan", nama: "", nik: "", tanggalLahir: "" };
  const wrapper = document.createElement("div");
  wrapper.className = "row-item";
  wrapper.innerHTML =
    '<button class="remove" onclick="this.parentElement.remove()">Hapus</button>' +
    "<label>Status</label>" +
    '<select class="kStatus"><option value="Pasangan">Pasangan</option><option value="Anak">Anak</option></select>' +
    '<label>Nama</label><input type="text" class="kNama">' +
    '<label>NIK</label><input type="text" class="kNik">' +
    '<label>Tanggal Lahir</label><input type="date" class="kTgl">';
  document.getElementById("keluargaList").appendChild(wrapper);
  wrapper.querySelector(".kStatus").value = existing.status;
  wrapper.querySelector(".kNama").value = existing.nama;
  wrapper.querySelector(".kNik").value = existing.nik;
  wrapper.querySelector(".kTgl").value = existing.tanggalLahir;
}

function doSaveKeluarga() {
  const arr = [];
  document.querySelectorAll("#keluargaList .row-item").forEach((row) => {
    arr.push({
      status: row.querySelector(".kStatus").value,
      nama: row.querySelector(".kNama").value,
      nik: row.querySelector(".kNik").value,
      tanggalLahir: row.querySelector(".kTgl").value,
    });
  });
  apiCall("saveKeluarga", { token: currentToken, keluargaArray: arr }).then((res) => {
    showMsg("keluargaMsg", res.success ? "Tersimpan." : "Gagal: " + res.message, res.success ? "success" : "error");
  });
}

// ---------- WILAYAH (dinamis) ----------
function addWilayahRow(existing) {
  existing = existing || { kecamatan: "", desa: "" };
  const wrapper = document.createElement("div");
  wrapper.className = "row-item";
  wrapper.innerHTML =
    '<button class="remove" onclick="this.parentElement.remove()">Hapus</button>' +
    "<label>Kecamatan</label><input type=\"text\" class=\"wKec\">" +
    "<label>Desa</label><input type=\"text\" class=\"wDesa\">";
  document.getElementById("wilayahList").appendChild(wrapper);
  wrapper.querySelector(".wKec").value = existing.kecamatan;
  wrapper.querySelector(".wDesa").value = existing.desa;
}

function doSaveWilayah() {
  const arr = [];
  document.querySelectorAll("#wilayahList .row-item").forEach((row) => {
    arr.push({
      kecamatan: row.querySelector(".wKec").value,
      desa: row.querySelector(".wDesa").value,
    });
  });
  apiCall("saveWilayah", { token: currentToken, wilayahArray: arr }).then((res) => {
    showMsg("wilayahMsg", res.success ? "Tersimpan." : "Gagal: " + res.message, res.success ? "success" : "error");
  });
}
