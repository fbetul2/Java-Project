let sure = 25 * 60; // Saniye cinsinden
let baslangicSuresi = 25; // Dakika cinsinden
let timerInterval;
let calisiyor = false;

// Kullanıcı dakikayı değiştirdiğinde
function sureyiAyarla() {
    if(!calisiyor) {
        const inputDeger = document.getElementById("hedefDakika").value;
        baslangicSuresi = parseInt(inputDeger);
        sure = baslangicSuresi * 60;
        guncelleEkrani();
    }
}

function guncelleEkrani() {
    const dk = Math.floor(sure / 60);
    const sn = sure % 60;
    const timerElement = document.getElementById("timer");
    if(timerElement) {
        timerElement.innerText = `${dk < 10 ? '0' : ''}${dk}:${sn < 10 ? '0' : ''}${sn}`;
    }
}

function baslat() {
    if (!calisiyor) {
        calisiyor = true;
        // Inputu kilitle
        document.getElementById("hedefDakika").disabled = true;
        
        timerInterval = setInterval(() => {
            if (sure > 0) {
                sure--;
                guncelleEkrani();
            } else {
                durdur();
                alert("Süre doldu!");
                kaydet(); // Süre bitince otomatik kaydet
            }
        }, 1000);
    }
}

function durdur() {
    calisiyor = false;
    clearInterval(timerInterval);
}

function sifirla() {
    durdur();
    document.getElementById("hedefDakika").disabled = false; // Kilidi aç
    sureyiAyarla(); // Başa dön
}

// Kaydet Butonuna Basınca (Veya süre bitince)
function kaydetHazirlik() {
    durdur();
    // Harcanan süreyi hesapla (Dakika cinsinden, yukarı yuvarla)
    const kalanSaniye = sure;
    const toplamSaniye = baslangicSuresi * 60;
    const harcananSaniye = toplamSaniye - kalanSaniye;
    
    let harcananDakika = Math.floor(harcananSaniye / 60);
    if (harcananSaniye % 60 > 0) harcananDakika++; // Saniye arttıysa 1 dk say
    
    if (harcananDakika === 0) harcananDakika = 1; // En az 1 dk

    // Formdaki gizli inputa yaz
    document.getElementById("gizliSure").value = harcananDakika;
    
    // Formu gönder
    document.getElementById("pomodoroForm").submit();
}

window.onload = guncelleEkrani;