
var deferredPrompt;
var enableNotificationsButtons = document.querySelectorAll('.enable-notifications');
var disableNotificationsButtons = document.querySelectorAll('.disable-notifications');

// Caso o navegador não suporte Promise habilita os recursos por pollyfill
if (!window.Promise) {
  window.Promise = Promise;
}

// Registrar o Service Worker (sw.js)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(function () {
      console.log('Service worker registered!');
    })
    .catch(function(err) {
      console.log(err);
    });
}

window.addEventListener('beforeinstallprompt', function(event) {
  console.log('beforeinstallprompt fired');
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

// Exibe mensagem de confirmação da subscrição
function displayConfirmNotification() {
  if ('serviceWorker' in navigator) {
    var options = {
      body: 'You successfully subscribed to our Notification service!',
      icon: '/src/images/icons/app-icon-96x96.png',
      image: '/src/images/sf-boat.jpg',
      dir: 'ltr',
      lang: 'en-US', // BCP 47,
      vibrate: [100, 50, 200],
      badge: '/src/images/icons/app-icon-96x96.png',
      tag: 'confirm-notification',
      renotify: true,
      actions: [
        { action: 'confirm', title: 'Okay', icon: '/src/images/icons/app-icon-96x96.png' },
        { action: 'cancel', title: 'Cancel', icon: '/src/images/icons/app-icon-96x96.png' }
      ]
    };

    navigator.serviceWorker.ready
      .then(function(swreg) {
        swreg.showNotification('Successfully subscribed!', options);
      });
  }
}

// 
function configurePushSub() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  var reg;
  navigator.serviceWorker.ready
    .then(function(swreg) { // verifica se o service worker está pronto
      reg = swreg;
      return swreg.pushManager.getSubscription();
    })
    .then(function(sub) { // verifica se já existe uma subscrição
      if (sub === null) {
        // Cria a nova subscrição usando a chave pública
        var vapidPublicKey = 'BBi45lQ8J24_-0Ja6uaRuvC5DD2_DxqjoWVh_1UxFeO34BBw3fneevukBjPo53CTM17zctIdq2G78_c_KVA6ntI';
        var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
        return reg.pushManager.subscribe({ // retorna a nova subscrição
          userVisibleOnly: true, 
          applicationServerKey: convertedVapidPublicKey
        });
      } else {
        // We have a subscription
      }
    })
    .then(function(newSub) {
      return fetch('http://localhost:5000/api/pushnotification/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(newSub)
      })
    })
    .then(function(res) {
      if (res.ok) {
        displayConfirmNotification();
      }
    })
    .catch(function(err) {
      console.log(err);
    });
}

function askForNotificationPermission() {
  Notification.requestPermission(function(result) {
    console.log('User Choice', result);
    if (result !== 'granted') {
      console.log('No notification permission granted!');
    } else {
      configurePushSub();
      // displayConfirmNotification();
    }
  });
}

if ('Notification' in window && 'serviceWorker' in navigator) {
  for (var i = 0; i < enableNotificationsButtons.length; i++) {
    enableNotificationsButtons[i].style.display = 'inline-block';
    enableNotificationsButtons[i].addEventListener('click', askForNotificationPermission);
  }

  for (var i = 0; i < disableNotificationsButtons.length; i++) {
    disableNotificationsButtons[i].style.display = 'inline-block';
    disableNotificationsButtons[i].addEventListener('click', function() {
      console.log('Disable notifications');
      if ('serviceWorker' in navigator) {
        debugger;
        // Desregistra o Service Worker
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          for (let registration of registrations) {
            registration.unregister(); // Remove o registro do Service Worker
          }
        });
      
        // Limpa o cache
        caches.keys().then(function(names) {
          for (let name of names) {
            caches.delete(name); // Remove todos os caches armazenados
          }
        });
      }      
    });
  }
}