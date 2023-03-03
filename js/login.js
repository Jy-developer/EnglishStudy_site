//페이지의 이미지 등이 로딩 끝나면 실행되는 코드
function showLoading() {
  $("#loading").show();
  $("#loading-image").show();
}
function hideLoading() {
  $("#loading").hide();
  $("#loading-image").hide();
}

$(window).on("load", function () {
  // $('#loading').toggleClass('hidden');
  hideLoading();
});
function checkAuthenticatedAndSeparateWay() {
  //로딩 이미지 띄움
  showLoading();
  //db read 후 권한 소유 여부 결과 체크
  const db = firebase.firestore();
  db.collection("authentic")
    .doc("version")
    .get()
    .then((doc) => {
      //권한 있음
      hideLoading();
      window.location.replace("/list_cardUI.html");
    })
    .catch((error) => {
      //인증 번호 틀림
      hideLoading();
      window.location.replace("/write_detail.html");
    });
}

function googleSignIn() {
  // Sign into Firebase using popup auth & Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase
    .auth()
    .signInWithPopup(provider)
    .then((result) => {
      checkAuthenticatedAndSeparateWay();
    })
    .catch((e) => {
      const errorCode = e.code;
      switch (errorCode) {
        case "auth/account-exists-with-different-credential":
          swal(
            "",
            "Already exists an account with the email address. Contact the Server admin.",
            "error"
          );
          break;
        case "auth/auth-domain-config-required":
          swal("", "App initialization error.", "error");
          break;
        case "auth/cancelled-popup-request":
          swal("", "Only one popup request is allowed at one time.", "error");
          break;
        case "auth/operation-not-allowed":
          swal(
            "",
            "Type of account corresponding to the credential is not enabled.",
            "error"
          );
          break;
        case "auth/operation-not-supported-in-this-environment":
          swal(
            "",
            "Operation is not supported in the environment your application is running on.",
            "error"
          );
          break;
        case "auth/popup-blocked":
          swal("", "Pop-up was blocked by the browser.", "error");
          break;
        case "auth/popup-closed-by-user":
          swal(
            "",
            "Popup window is closed by the user without completing the sign in.",
            "error"
          );
          break;
        case "auth/unauthorized-domain":
          swal("", "Domain is not authorized for operations.", "error");
          break;
        default:
          break;
      }
    });
}

function facebookSignIn() {
  // Sign into Firebase using popup auth & Google as the identity provider.
  var provider = new firebase.auth.FacebookAuthProvider();
  firebase
    .auth()
    .signInWithPopup(provider)
    .then((result) => {
      checkAuthenticatedAndSeparateWay();
    })
    .catch((e) => {
      const errorCode = e.code;
      switch (errorCode) {
        case "auth/account-exists-with-different-credential":
          swal(
            "",
            "Already exists an account with the email address. Contact the Server admin.",
            "error"
          );
          break;
        case "auth/auth-domain-config-required":
          swal("", "App initialization error.", "error");
          break;
        case "auth/cancelled-popup-request":
          swal("", "Only one popup request is allowed at one time.", "error");
          break;
        case "auth/operation-not-allowed":
          swal(
            "",
            "Type of account corresponding to the credential is not enabled.",
            "error"
          );
          break;
        case "auth/operation-not-supported-in-this-environment":
          swal(
            "",
            "Operation is not supported in the environment your application is running on.",
            "error"
          );
          break;
        case "auth/popup-blocked":
          swal("", "Pop-up was blocked by the browser.", "error");
          break;
        case "auth/popup-closed-by-user":
          swal(
            "",
            "Popup window is closed by the user without completing the sign in.",
            "error"
          );
          break;
        case "auth/unauthorized-domain":
          swal("", "Domain is not authorized for operations.", "error");
          break;
        default:
          break;
      }
    });
}

function signOut() {
  // Sign out of Firebase.
  firebase.auth().signOut();
}

// Returns true if a user is signed-in.
function isUserSignedIn() {
  return !!firebase.auth().currentUser;
  // !! 는 JS에서 undefined, "", 0 일때 false를 반환, 그외엔 전부 true를 반환한다.
}

// Initiate firebase auth.
function initFirebaseAuth() {
  // Listen to auth state changes.
  firebase.auth().onAuthStateChanged(authStateObserver);
  //위 코드의 authStateObserver자리에는 firebaseUser가 들어가도 됨. 람다식으로 쓰면
  // firebase.auth().onAuthStateChanged(firebaseUser =>{
  //     if(firebaseUser){
  //         console.log(firebaseUser);
  //     }else{
  //         console.log('not logged in');
  //     }
  // });
  //이게 람다식으로 적은 예시
}

// Triggers when the auth state change for instance when the user signs-in or signs-out.
function authStateObserver(user) {
  if (user) {
    // User is signed in!
    //db 조회해서 인증번호가 맞는지 확인해서 분기하는 코드
    checkAuthenticatedAndSeparateWay(); //이 코드가 로그인 되어 있는 사람을 바로 list_cardUI.html 로 옮기는 코드임
  } else {
    // User is signed out!
  }
}

//구글 OAUTH 로그인 버튼 메소드 할당
var googleSignInButton = document.getElementById("google_login_btn");
googleSignInButton.addEventListener("click", googleSignIn);
//페이스북 OAUTH 로그인 버튼 메소드 할당
var facebookSignInButton = document.getElementById("facebook_login_btn");
facebookSignInButton.addEventListener("click", facebookSignIn);

//이메일,패스워드 로그인 버튼 메소드 할당
const txtEmail = document.getElementById("txtEmail");
const txtPassword = document.getElementById("txtPassword");
const btnLogInWithEmail = document.getElementById("btnLogInWithEmail");
btnLogInWithEmail.addEventListener("click", (e) => {
  const email = txtEmail.value;
  const password = txtPassword.value;
  const auth = firebase.auth();
  //Sign in
  const promise = auth.signInWithEmailAndPassword(email, password);
  promise
    .then((result) => {
      checkAuthenticatedAndSeparateWay();
    })
    .catch((e) => {
      const errorCode = e.code;
      switch (errorCode) {
        case "auth/invalid-email":
          swal("", "The provided value for the email is invalid.", "error");
          break;
        case "auth/user-disabled":
          swal(
            "",
            "User account has been disabled by an administrator.",
            "error"
          );
          break;
        case "auth/user-not-found":
          swal("", "There is no user.", "error");
          break;
        case "auth/wrong-password":
          swal("", "Password is invalid for the given email.", "error");
          break;
        default:
          break;
      }
    });
});

//이메일로 가입 시 모든 input 및 체크박스 체크되었는지 감시 후 버튼 활성화하는 코드
const form = document.querySelector("#form__wrap");

const emailInput = document.querySelector("#createEmailInput");
const passwordInput = document.querySelector("#createPasswordInput");
const passwordConfirmInput = document.querySelector(
  "#createConfirmPasswordInput"
);
const termsCheckBox = document.querySelector("#createTermsCheckboxInput");
const submitButton = document.querySelector("#createSubmitBtn");

const agreement = {
  isExistEmail: false,
  isExistPassword: false,
  isExistConfirmPassword: false,
  isCheckedTerm: false,
  isSamePasswordAndConfirm: false,
};

form.addEventListener("submit", (e) => e.preventDefault()); //새로고침 (submit) 되는 것 막음
function showSubmitButton() {
  const {
    isExistEmail,
    isExistPassword,
    isExistConfirmPassword,
    isCheckedTerm,
    isSamePasswordAndConfirm,
  } = agreement;
  if (
    isExistEmail &&
    isExistPassword &&
    isExistConfirmPassword &&
    isCheckedTerm &&
    isSamePasswordAndConfirm
  ) {
    submitButton.style.visibility = "visible";
  } else {
    submitButton.style.visibility = "hidden";
  }
}

emailInput.addEventListener("input", (e) => {
  agreement.isExistEmail = e.target.value == "" ? false : true;
  showSubmitButton();
});
passwordInput.addEventListener("input", (e) => {
  agreement.isExistPassword = e.target.value == "" ? false : true;
  agreement.isSamePasswordAndConfirm =
    e.target.value == passwordConfirmInput.value ? true : false;
  showSubmitButton();
});
passwordConfirmInput.addEventListener("input", (e) => {
  agreement.isExistConfirmPassword = e.target.value == "" ? false : true;
  agreement.isSamePasswordAndConfirm =
    e.target.value == passwordInput.value ? true : false;
  showSubmitButton();
});
termsCheckBox.addEventListener("input", (e) => {
  agreement.isCheckedTerm = e.target.checked == false ? false : true;
  showSubmitButton();
});

submitButton.addEventListener("click", (e) => {
  showLoading(); //로딩 이미지 on
  const email = emailInput.value;
  const password = passwordInput.value;
  const auth = firebase.auth();
  //Sign in
  const promise = auth.createUserWithEmailAndPassword(email, password);
  promise
    .then((user) => {
      hideLoading(); //로딩 닫음
      //이건 가입 성공시 한번만 작동함.
      $("#modal-form-signup").modal("hide"); //모달 닫고
      window.location.replace("/write_detail.html"); //개별 정보 넣는 페이지로 이동
    })
    .catch((e) => {
      hideLoading(); //로딩 닫음
      const errorCode = e.code;
      switch (errorCode) {
        case "auth/email-already-in-use":
          //swal(타이틀, 메시지, "아이콘-> warning, error, success, info 중 택일")
          //버튼메시지까지 바꾸고 싶으면, 뒷부분 "아이콘", {button:"버튼문구",}) 할 것
          swal(
            "",
            "Already exists an account with the given email address.",
            "error"
          );
          break;
        case "auth/invalid-email":
          swal("", "Email address is not valid.", "error");
          break;
        case "auth/operation-not-allowed":
          swal("Error", "Email/password accounts are not enabled.", "warning");
          break;
        case "auth/weak-password":
          swal("", "The password is not strong enough.", "error");
          break;
        default:
          break;
      }
    });
});

//비밀번호 재설정 모달 부분
const emailToSendResetPassword = document.querySelector(
  "#emailToSendResetPassword"
);
const submitResetPasswordBtn = document.querySelector(
  "#submitResetPasswordBtn"
);

function sendResetEmailUserPassword(email) {
  const emailAddress = email + ""; //toString
  if (email == "") {
    swal(
      "Empty Email",
      "You must enter the email you used to sign up.",
      "error"
    );
    return;
  }
  firebase
    .auth()
    .sendPasswordResetEmail(emailAddress)
    .then(function () {
      swal(
        "Good Job!!",
        "A link to reset your password has been sent to the email address you signed up for. Please check your mailbox",
        "success"
      );
      $("#modal-pass-change-email").modal("hide"); //모달 닫기
    })
    .catch(function (error) {
      swal(
        "Error",
        "A server error occurred due to an unsubscribed e-mail or incorrect e-mail format. Please check and try again.",
        "error"
      );
    });
}
submitResetPasswordBtn.addEventListener("click", (e) => {
  sendResetEmailUserPassword(emailToSendResetPassword.value);
});

// initialize Firebase - 항상 마지막에 실행되어야 함. (디버그중엔 이것때문에 코드가 중단되어버림 )
initFirebaseAuth();

//내 계정 기억하기 - cookie 관련
function setCookie(cookieName, value, exdays) {
  var exdate = new Date();
  exdate.setDate(exdate.getDate() + exdays);
  var cookieValue =
    escape(value) + (exdays == null ? "" : "; expires=" + exdate.toGMTString());
  document.cookie = cookieName + "=" + cookieValue;
}

function deleteCookie(cookieName) {
  var expireDate = new Date();
  expireDate.setDate(expireDate.getDate() - 1); //어제날짜를 쿠키 소멸날짜로 설정
  document.cookie = cookieName + "= " + "; expires=" + expireDate.toGMTString();
}

function getCookie(cookieName) {
  cookieName = cookieName + "=";
  var cookieData = document.cookie;
  var start = cookieData.indexOf(cookieName);
  var cookieValue = "";
  if (start != -1) {
    start += cookieName.length;
    var end = cookieData.indexOf(";", start);
    if (end == -1) end = cookieData.length;
    cookieValue = cookieData.substring(start, end);
  }
  return unescape(cookieValue);
}

$(document).ready(function () {
  //id 쿠키 저장
  var userInputId = getCookie("userInputId");
  $("input[name='txtEmail']").val(userInputId);
  //Pwd 쿠키 저장
  var userInputPwd = getCookie("userInputPwd");
  $("input[name='txtPassword']").val(userInputPwd);
  //이미 저장된 쿠키(이메일정보)가 있을 경우, 내 계정 기억하기 버튼을 클릭상태로 둠
  if ($("input[name='txtEmail']").val() != "") {
    $("#idPassSaveCheck").attr("checked", true);
  }
  //내 계정 기억하기 버튼 클릭시 동작
  $("#idPassSaveCheck").change(function () {
    if ($("#idPassSaveCheck").is(":checked")) {
      //내 계정 기억 버튼 체크시
      var userInputId = $("input[name='txtEmail']").val();
      setCookie("userInputId", userInputId, 365);
      var userInputPwd = $("input[name='txtPassword']").val();
      setCookie("userInputPwd", userInputPwd, 365);
    } else {
      //내 계정 기억버튼 해제 시
      deleteCookie("userInputId");
      deleteCookie("userInputPwd");
    }
  });
  $("input[name='txtEmail']").keyup(function () {
    if ($("#idPassSaveCheck").is(":checked")) {
      var userInputId = $("input[name='txtEmail']").val();
      setCookie("userInputId", userInputId, 365);
    }
  });
  $("input[name='txtPassword']").keyup(function () {
    if ($("#idPassSaveCheck").is(":checked")) {
      var userInputPwd = $("input[name='txtPassword']").val();
      setCookie("userInputPwd", userInputPwd, 365);
    }
  });
  //Email 가입시 password 입력시 조건충족되는 password인지 리스너 달아서 색으로 표시
  var oldVal = "";
  $("#createPasswordInput").on("change keyup paste", function () {
    var currentVal = $(this).val();
    if (currentVal == oldVal) {
      return; //check to prevent multiple simultaneous triggers
    }
    oldVal = currentVal;
    //action to be performed on textarea changed
    // $('#p_article_length').text(`number of characters: ${$(this).val().length}`);
    if ($(this).val().length >= 6) {
      //패스워드 조건 충족시
      $(this).css({
        border: "0.0625rem solid #18634B",
        "padding-right": "calc(1.5em + 1.2rem)",
        "background-image": `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%2318634B' d='M2.3 6.73L.6 4.53c-.4-1.04.46-1.4 1.1-.8l1.1 1.4 3.4-3.8c.6-.63 1.6-.27 1.2.7l-4 4.6c-.43.5-.8.4-1.1.1z'/%3e%3c/svg%3e")`,
        "background-repeat": "no-repeat",
        "background-position": `center right calc(0.375em + 0.3rem)`,
        "background-size": `calc(0.4875rem + 0.6rem) calc(0.4875rem + 0.6rem)`,
      });
    } else {
      //패스워드 조건 불충족시
      $(this).css({
        border: "0.0625rem solid #A91E2C",
        "padding-right": "calc(1.5em + 1.2rem)",
        "background-image": `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='%23A91E2C' viewBox='-2 -2 7 7'%3e%3cpath stroke='%23A91E2C' d='M0 0l3 3m0-3L0 3'/%3e%3ccircle r='.5'/%3e%3ccircle cx='3' r='.5'/%3e%3ccircle cy='3' r='.5'/%3e%3ccircle cx='3' cy='3' r='.5'/%3e%3c/svg%3E")`,
        "background-repeat": "no-repeat",
        "background-position": `center right calc(0.375em + 0.3rem)`,
        "background-size": `calc(0.4875rem + 0.6rem) calc(0.4875rem + 0.6rem)`,
      });
    }
  });

  var oldVal2 = "";
  $("#createConfirmPasswordInput").on("change keyup paste", function () {
    let currentVal = $(this).val();
    if (currentVal == oldVal2) {
      return; //check to prevent multiple simultaneous triggers
    }
    oldVal2 = currentVal;
    //action to be performed on textarea changed
    // $('#p_article_length').text(`number of characters: ${$(this).val().length}`);
    if ($(this).val() == $("#createPasswordInput").val()) {
      //위에 넣은 패스워드와 같다면
      $(this).css({
        border: "0.0625rem solid #18634B",
        "padding-right": "calc(1.5em + 1.2rem)",
        "background-image": `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%2318634B' d='M2.3 6.73L.6 4.53c-.4-1.04.46-1.4 1.1-.8l1.1 1.4 3.4-3.8c.6-.63 1.6-.27 1.2.7l-4 4.6c-.43.5-.8.4-1.1.1z'/%3e%3c/svg%3e")`,
        "background-repeat": "no-repeat",
        "background-position": `center right calc(0.375em + 0.3rem)`,
        "background-size": `calc(0.4875rem + 0.6rem) calc(0.4875rem + 0.6rem)`,
      });
    } else {
      //위와 패스워드가 다르면
      $(this).css({
        border: "0.0625rem solid #A91E2C",
        "padding-right": "calc(1.5em + 1.2rem)",
        "background-image": `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='%23A91E2C' viewBox='-2 -2 7 7'%3e%3cpath stroke='%23A91E2C' d='M0 0l3 3m0-3L0 3'/%3e%3ccircle r='.5'/%3e%3ccircle cx='3' r='.5'/%3e%3ccircle cy='3' r='.5'/%3e%3ccircle cx='3' cy='3' r='.5'/%3e%3c/svg%3E")`,
        "background-repeat": "no-repeat",
        "background-position": `center right calc(0.375em + 0.3rem)`,
        "background-size": `calc(0.4875rem + 0.6rem) calc(0.4875rem + 0.6rem)`,
      });
    }
  });

  if (window.location.href.indexOf("#modal-privacy-policy") != -1) {
    $("#modal-privacy-policy").modal("show");
  }
  window.addEventListener("keydown", (e) => {
    const key = e.key;
    if (key === "Enter") {
      e.preventDefault();
      if (
        !document
          .getElementById("modal-pass-change-email")
          .classList.contains("show") &&
        !document
          .getElementById("modal-form-signup")
          .classList.contains("show") &&
        !document
          .getElementById("modal-privacy-policy")
          .classList.contains("show")
      ) {
        btnLogInWithEmail.click();
      }
    }
  });
});
