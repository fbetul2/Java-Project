let stompClient = null;
let seciliAliciId = null;
let seciliResimBase64 = null; // Resim verisini tutacak değişken

function baglan(benimId) {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);
    
    stompClient.connect({}, function (frame) {
        console.log('Bağlandı: ' + frame);
        stompClient.subscribe('/topic/user-' + benimId, function (mesaj) {
            const m = JSON.parse(mesaj.body);
            // Mesajı göster (Sadece şu an açık olan kişiyle konuşuyorsak)
            // (Basitlik için direkt gösteriyoruz, ileride ID kontrolü eklenebilir)
            ekranaYaz(m.metin, m.resimData, true);
        });
    });
}

function sohbetSec(element) {
    const aliciId = element.getAttribute("data-id");
    const aliciAdi = element.getAttribute("data-ad");

    document.querySelectorAll('.user-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    
    seciliAliciId = aliciId;
    document.getElementById("chat-header-name").innerHTML = `<span class="fw-bold text-burgundy">${aliciAdi}</span>`;
    document.getElementById("chat-box").innerHTML = ""; 
    
    fetch('/api/mesajlar/' + aliciId)
        .then(response => response.json())
        .then(mesajlar => {
            mesajlar.forEach(m => {
                const gelenMi = (m.gonderen.id != window.benimIdGlobal); 
                // Veritabanından gelen resim base64 formatındaysa başına header ekle
                let resimSrc = null;
                if (m.resimBase64) {
                    resimSrc = "data:image/png;base64," + m.resimBase64;
                }
                ekranaYaz(m.mesajMetni, resimSrc, gelenMi);
            });
            scroolAsagi();
        });
}

// Resim seçilince çalışır
function resimSecildi(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            seciliResimBase64 = e.target.result; // Base64 verisini al
            document.getElementById("mesaj-input").placeholder = "Resim seçildi. Göndermek için tıkla...";
            document.getElementById("mesaj-input").focus();
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function mesajGonder() {
    const girdi = document.getElementById("mesaj-input");
    const metin = girdi.value;

    if ((metin.trim() !== "" || seciliResimBase64 !== null) && seciliAliciId !== null) {
        const mesajVerisi = {
            'aliciId': seciliAliciId,
            'metin': metin,
            'resimData': seciliResimBase64 // Resmi de pakete ekle
        };
        
        stompClient.send("/app/sohbet", {}, JSON.stringify(mesajVerisi));
        
        // Kendi ekranıma yaz
        ekranaYaz(metin, seciliResimBase64, false);
        
        // Temizlik
        girdi.value = "";
        girdi.placeholder = "Bir mesaj yaz...";
        seciliResimBase64 = null; // Resmi sıfırla
        document.getElementById("resim-input").value = ""; // Inputu sıfırla
        
        scroolAsagi();
    } else if (seciliAliciId === null) {
        alert("Lütfen sohbet etmek istediğiniz bir kişiyi seçin.");
    }
}

function ekranaYaz(metin, resimSrc, gelenMi) {
    const kutu = document.getElementById("chat-box");
    const div = document.createElement("div");
    
    div.classList.add("message");
    div.classList.add(gelenMi ? "incoming" : "outgoing");
    
    let icerikHTML = "";
    
    // Eğer resim varsa ekle
    if (resimSrc) {
        icerikHTML += `<img src="${resimSrc}" style="max-width: 100%; border-radius: 10px; margin-bottom: 5px; display: block;">`;
    }
    
    // Metin varsa ekle
    if (metin) {
        icerikHTML += `<span>${metin}</span>`;
    }
    
    div.innerHTML = icerikHTML;
    kutu.appendChild(div);
    scroolAsagi();
}

function scroolAsagi() {
    const kutu = document.getElementById("chat-box");
    if(kutu) kutu.scrollTop = kutu.scrollHeight;
}

document.addEventListener("DOMContentLoaded", function() {
    const input = document.getElementById("mesaj-input");
    if(input) {
        input.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                mesajGonder();
            }
        });
    }
});