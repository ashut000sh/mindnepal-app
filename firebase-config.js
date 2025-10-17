const firebaseConfig = {
    apiKey: "AIzaSyCvlt-EIEpnB_CyQ1G8T7KRA-QnuvGiZog",
    authDomain: "mindnepal-76835.firebaseapp.com",
    projectId: "mindnepal-76835",
    storageBucket: "mindnepal-76835.appspot.com",
    messagingSenderId: "851183913615",
    appId: "1:851183913615:web:22db2e72d822a60390fefa",
    measurementId: "G-TQZN83CM4Z"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();