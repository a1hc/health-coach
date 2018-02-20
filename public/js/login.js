import intializeDB from '../modules/db.js';
const db = intializeDB();

window.addEventListener('DOMContentLoaded', function () {
	redirect();
});

function redirect(){
	var uiConfig = {
        signInSuccessUrl: 'survey.html',
        signInOptions: [
          // Leave the lines as is for the providers you want to offer your users.
          firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        ],
        // Terms of service url.
        tosUrl: '<your-tos-url>'
    };

    // Initialize the FirebaseUI Widget using Firebase.
    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    // The start method will wait until the DOM is loaded.
    ui.start('#firebaseui-auth-container', uiConfig);
}