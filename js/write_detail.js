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
  showClassListToSelect();
});

function showClassListToSelect() {
  let strOption = `<option selected>${my_custom_vars.classNameDefaultValue}</option>`;
  my_custom_vars.classNameList.forEach((className, index) => {
    strOption += `<option value="${index + 1}">${className}</option>`;
  });
  $("#txtRelation").append(strOption);
}

//비어있거나 공백인 문자열인 경우 -> true 반환
function isBlankOrEmptyString(str) {
  return !str || !str.toString().trim();
}

// Initiate firebase auth.
function initFirebaseAuth() {
  // Listen to auth state changes.
  firebase.auth().onAuthStateChanged(authStateObserver);
}

// Triggers when the auth state change for instance when the user signs-in or signs-out.
function authStateObserver(user) {
  if (user) {
    // User is signed in!
    var h2_message = document.getElementById("show_user_email");
    h2_message.innerHTML =
      "Welcome, " + user.email.substr(0, user.email.indexOf("@")) + "...";
  } else {
    // User is signed out!
    window.top.location.replace("/index.html");
  }
}

var db = firebase.firestore();

//이메일,패스워드 최종가입 버튼 메소드 할당
const txtName = document.getElementById("txtName");
const self_intro = document.getElementById("txtSelfIntro");
const auth_number = document.getElementById("auth_number");

const btnSubmitAuthNumber = document.getElementById("btnSubmitAuthNumber");

function showSubmitButton() {
  if (
    isBlankOrEmptyString(txtName.value) ||
    $("#txtRelation option:selected").text() ==
      my_custom_vars.classNameDefaultValue ||
    isBlankOrEmptyString(auth_number.value) ||
    isBlankOrEmptyString(self_intro.value)
  ) {
    //정보 덜 넣었으면
    btnSubmitAuthNumber.style.visibility = "hidden";
  } else {
    //제대로 정보 넣었을 때
    btnSubmitAuthNumber.style.visibility = "visible";
  }
}

txtName.addEventListener("input", (e) => showSubmitButton());
$("#txtRelation").change(function () {
  showSubmitButton();
});
self_intro.addEventListener("input", (e) => showSubmitButton());
auth_number.addEventListener("input", (e) => showSubmitButton());

//db 에 user 정보 기입
btnSubmitAuthNumber.addEventListener("click", (e) => {
  showLoading();

  const userInfo = new my_custom_vars.InfoUser();
  userInfo.name = txtName.value;
  userInfo.relation = $("#txtRelation option:selected").text();
  userInfo.uid = firebase.auth().currentUser.uid;
  userInfo.selfIntro = self_intro.value;
  userInfo.wordWannaSay = auth_number.value;
  userInfo.isFirstLogin = true;
  userInfo.isFirstWritingEventTriggered =
    userInfo.isHalfClearEventTriggered =
    userInfo.isAllClearEventTriggered =
    userInfo.isOnlyOneFirstExplorerEventTriggered =
    userInfo.isLongWriterEventTriggered =
    userInfo.isMaxPhotoUploadEventTriggered =
      false;

  const promise = db
    .collection("usersInfo")
    .doc(firebase.auth().currentUser.uid)
    .withConverter(my_custom_vars.infoUserConverter)
    .set(userInfo);
  promise
    .then(() => {
      // 유저 db 정보 입력 성공시
      //db read 후 권한 소유 여부 결과 체크
      db.collection("authentic")
        .doc("version")
        .get()
        .then((doc) => {
          //권한 있음
          hideLoading();

          db.collection("writingRecord")
            .doc(firebase.auth().currentUser.uid)
            .set({ timestamps: 0 }, { merge: true })
            .then(() => {
              window.location.replace("/list_cardUI.html");
            })
            .catch((error2) => {
              hideLoading();
              my_custom_vars.showSwalErrorMessage_db(error2);
            });
        })
        .catch((error3) => {
          //인증 번호 틀림
          hideLoading();
          my_custom_vars.showSwalErrorMessage_db(error3);
          setTimeout(() => {
            window.top.location.replace("/index.html");
          }, 2000);
        });
    })
    .catch((error) => {
      hideLoading();
      my_custom_vars.showSwalErrorMessage_db(error);
    });
});

// initialize Firebase
initFirebaseAuth();

$(document).ready(function () {
  //로그아웃 버튼
  $("#logout_btn").click(my_custom_vars.userLogout);
});
