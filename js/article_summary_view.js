function showLoading() {
  $("#loading").show();
  $("#loading-image").show();
}
function hideLoading() {
  $("#loading").hide();
  $("#loading-image").hide();
}

$(window).on("load", function () {
  // 글 사진 뿌리는게 생각보다 늦어서, 사진 로딩후 hideLoading()하기로 함
  // hideLoading();
});

$(window).bind("beforeunload", function () {
  unsubscribe();
});

function setOptionCoverOrContainByExistenceProfileImg(obj) {
  var result = obj ? "cover" : "contain";
  return result;
}

//시간대별 인사 문구 교체. 실행 시기는 firebase Auth 감시자 작동시
function sayHelloToUser() {
  const userName = usersInfoMap.get(firebase.auth().currentUser.uid).name;
  $("#nameToHello").text(userName + ".");

  const today = new Date();
  const hours = today.getHours();
  if (hours >= 6 && hours < 12) {
    $("#time_changing_msg").prepend("Good Morning, ");
  } else if (hours >= 12 && hours < 17) {
    $("#time_changing_msg").prepend("Good Afternoon, ");
  } else if (hours >= 17 && hours < 21) {
    $("#time_changing_msg").prepend("Good Evening, ");
  } else if ((hours >= 21 && hours < 24) || hours >= 0) {
    $("#time_changing_msg").prepend("Good Evening, ");
  }
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
    initFirestoreDBOperation();
  } else {
    // User is signed out!
  }
}

var db = firebase.firestore();
var storage = firebase.storage();

function getProfileImgOrDefaultValue(obj) {
  var result = obj ? obj.image : "/img/user_without_profile.png";
  return result;
}

function downloadSummaryAsCSV() {
  // Data extraction
  // 왼쪽 사이드 바 의 두번째 자손 요소부터 ( p-반이름1, div-학생, div-학생, p-반이름2, div-학생 ...) 구조
  const $childArrStartSecondSon = [
    ...document.querySelectorAll("#div_left_summary > *:nth-child(n+2)"),
  ];
  let className = "";
  let resultString = "반 이름,이름,일기 수\n";
  $childArrStartSecondSon.forEach((elementNode) => {
    if (elementNode.tagName === "P") {
      className = elementNode.textContent;
    } else if (elementNode.tagName === "DIV") {
      const studentName = elementNode.querySelector("p").textContent;
      const diaryCount = elementNode
        .querySelector("div")
        .querySelector("div:nth-child(3)").textContent;
      resultString += `"${className}",${studentName},${diaryCount}\n`;
    }
  });
  // Making CSV file
  const hiddenElement = document.createElement("a");
  hiddenElement.href =
    `data:text/csv;charset=utf-8,` + encodeURI("\ufeff" + resultString);
  hiddenElement.target = "_blank";
  hiddenElement.download = `English_diary_writing_count_summary.csv`;
  hiddenElement.click();
}

// 학생 명 클릭시 가운데+우측 칼럼이 학생의 일기 전부와 월별 일기 빈도그래프, 목록을 갱신
function listOneStudentsAllDiary(uid) {
  const eachMonthCount = new Map(); //월별 그래프 위한 맵 객체 컨테이너 준비
  //아래 배열에 1명의 전체 글 목록 존재. 단, 글 한번도 안 쓴 사람은 이 변수에 빈 배열 넣어줌
  const thisGuysDiarys = postingMap.get(uid) ? postingMap.get(uid) : [];
  const studentName = usersInfoMap.get(uid).name;
  const profileImageUrl = getProfileImgOrDefaultValue(profileImageMap.get(uid));

  const $main = document.querySelector("main");
  let centerColumnHtmlString = "";
  const $right_sideBar = document.getElementById("ul_right_sidebar");
  let rightSideColumnHtmlString = "";
  thisGuysDiarys.forEach((postingDTO, index) => {
    const title = postingDTO.title;
    const content = postingDTO.explain;
    const date = moment(postingDTO.timestamp).format("yyyy.MM.DD");
    const shortDate = date.slice(2);
    const h1String = `<h1 class="bd-title display-3 font-weight-bold" id="${
      "forAnchor" + index
    }">${title}</h1>`;
    const divString = `<div class="mt-3 mb-5">
            <div class="card bg-primary shadow-soft border-light p-2 p-md-3">
                <div class="card-header rounded pb-0">
                    <div class="post-meta mb-4">
                        <div class="media d-flex align-items-center justify-content-between">
                            <div class="post-group">
                                <a>
                                    <img class="avatar-lg mr-4 img-fluid rounded-circle" src="${profileImageUrl}" alt="">
                                    <p class="font-weight-bold" style="display: inline;">${studentName}</p>
                                </a>
                            </div>
                            <div class="flex-grow-1"></div>
                            <div class="d-flex align-items-center">
                                <span class="small"><span class="far fa-calendar-alt mr-2"></span>${date}</span>
                            </div>
                        </div>
                    </div>                                
                </div>
                <div class="card-body pt-0 pb-0">                                
                    <p class="card-text mb-4" style="font-size: 1.1rem;">${content}</p>
                </div>
            </div>
        </div>`;
    centerColumnHtmlString += h1String + divString;

    const liString = `<li class="mb-1">
            <div class="media d-flex align-items-center justify-content-between">
                <div class="post-group">
                    <a class="d-flex" style="align-items:center;" href="#${
                      "forAnchor" + index
                    }">
                        <p style="margin-bottom: 0;">${title}</p>
                    </a>
                </div>
            <div class="flex-grow-1" style="min-width: 20px;"></div>
            <div class="d-flex">${shortDate}</div>
            </div>
        </li>`;
    rightSideColumnHtmlString += liString;
    //date.slice(5, 7);        //[07, 07, 06, 06, 05...]
    const month = date.slice(5, 7);
    const day = date.slice(8);
    if (day <= 15) {
      // 월 초
      const key = "early_" + month;
      eachMonthCount.has(key)
        ? eachMonthCount.set(key, eachMonthCount.get(key) + 1)
        : eachMonthCount.set(key, 1);
    } else {
      const key = "late_" + month;
      eachMonthCount.has(key)
        ? eachMonthCount.set(key, eachMonthCount.get(key) + 1)
        : eachMonthCount.set(key, 1);
    }
  });

  // 월별 일기 수 그래프 생성
  const ctx = document.getElementById("postSummaryGraph").getContext("2d");
  const graphLabelArr = [];
  [...eachMonthCount.keys()].forEach((monthString) => {
    monthString.startsWith("early")
      ? graphLabelArr.push(Number(monthString.slice(6)) + "월초")
      : graphLabelArr.push(Number(monthString.slice(5)) + "월말");
  });
  let chartStatus = Chart.getChart("postSummaryGraph"); // <canvas> id
  if (chartStatus != undefined) chartStatus.destroy();

  // DOM 몰아서 갱신
  while ($main.lastChild) $main.removeChild($main.lastChild);
  $main.innerHTML = centerColumnHtmlString; //가운데 칼럼 갱신 종료

  while ($right_sideBar.lastChild)
    $right_sideBar.removeChild($right_sideBar.lastChild);
  $right_sideBar.innerHTML = rightSideColumnHtmlString; //우측 칼럼 일기 목록 갱신 종료

  const myChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [...graphLabelArr].reverse(),
      datasets: [
        {
          label: `월별 일기 수`,
          data: [...eachMonthCount.values()].reverse(),
          backgroundColor: [
            "rgba(255, 99, 132, 0.2)",
            "rgba(54, 162, 235, 0.2)",
            "rgba(255, 206, 86, 0.2)",
            "rgba(75, 192, 192, 0.2)",
            "rgba(153, 102, 255, 0.2)",
            "rgba(255, 159, 64, 0.2)",
            "rgba(255, 99, 132, 0.2)",
            "rgba(54, 162, 235, 0.2)",
            "rgba(255, 206, 86, 0.2)",
            "rgba(75, 192, 192, 0.2)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            min: 0,
            max: 20,
            stepSize: 1,
          },
          afterDataLimits: (scale) => {
            scale.max *= 1.1;
          },
        },
      },
    },
  });
  window.scrollTo(0, 0);
}

//왼쪽 사이드바 반 별 학생 목록과 개별 글 업로드 수 표시 ( + first click event )
function showStudentListWithArticleNumber() {
  // my_custom_vars.classNameList : ['Thursday, 3rd period', 'Friday, 3rd period', 'Friday, 4th period']
  const map = new Map(); //맵 내부 구조 : 클래스명(키) - 배열(값)
  // 값으로서 배열은, [{개별유저uid : 글 수}, {개별유저uid : 글 수}...] 형태
  my_custom_vars.classNameList.forEach((className) => {
    map.set(className, []);
  });
  usersInfoMap.forEach((usersInfoDTO) => {
    try {
      //가입했지만 글 한번도 안 썼거나, 글 안 쓰고 탈퇴한 사람들 -> 글 0으로 만드는 부분
      if (postingMap.get(usersInfoDTO.uid)) {
        //글 1개라도 쓴 사람
        map.get(usersInfoDTO.relation).push({
          [usersInfoDTO.uid]: postingMap.get(usersInfoDTO.uid).length,
        });
      } else {
        // 글을 안 썼거나 탈퇴한 사람 ( undefined 나온 사람 )
        map.get(usersInfoDTO.relation).push({ [usersInfoDTO.uid]: 0 });
      }
    } catch (error) {
      if (!my_custom_vars.classNameList.includes(usersInfoDTO.relation)) {
        //이상한 반 이름으로 억지로 가입한 사람 있으면
        alert(
          `Someone signed up with a strange class name. Find him and change it. Name : ${usersInfoDTO.name}, class : ${usersInfoDTO.relation}`
        );
      }
    }
  });
  // 글 많이 쓴 순서대로 학생들 반 내부에서 정렬 => 안됨! 학생 이름 대로 정렬해야 함
  // 아래는 글 많이 쓴 순서대로 정렬시 기존 코드
  // map.forEach(arr => {
  //     arr.sort((a,b) => b[Object.keys(b)[0]] - a[aName]);
  // });
  map.forEach((arr) => {
    // arr : [{개별유저uid : 글 수}, {개별유저uid : 글 수}]
    arr.sort((a, b) => {
      const aName = usersInfoMap.get(Object.keys(a)[0]).name.toUpperCase();
      const bName = usersInfoMap.get(Object.keys(b)[0]).name.toUpperCase();
      return bName > aName ? -1 : bName < aName ? 1 : 0;
    });
  });
  const $left_summary = document.getElementById("div_left_summary");
  map.forEach((value, key) => {
    const template = document.createElement("template");
    let htmlString = `<p class="queryForClassName font-weight-bold pl-2 pt-1 mb-0" style="font-size:1.5rem;">${key}</p>`;
    value.forEach((obj) => {
      const userName = usersInfoMap.get(Object.keys(obj)[0]).name;
      htmlString += `<div class="card-body pt-2 px-3 pb-2">
                            <div class="media d-flex align-items-center justify-content-between">
                                <div class="post-group">
                                    <a class="d-flex" style="align-items:center;" onclick="listOneStudentsAllDiary('${
                                      Object.keys(obj)[0] + ""
                                    }')">
                                        <img class="avatar-md mr-2 img-fluid rounded-circle" src="${getProfileImgOrDefaultValue(
                                          profileImageMap.get(
                                            Object.keys(obj)[0]
                                          )
                                        )}" alt="" id="img_small_profile_img">
                                        <p data-uid="${
                                          Object.keys(obj)[0]
                                        }" class="font-weight-bold" style="display: inline; margin-bottom:0;">${userName}</p>
                                    </a>
                                </div>
                                <div class="flex-grow-1"></div>
                                <div class="d-flex">${
                                  obj[Object.keys(obj)[0]]
                                }</div>
                            </div>
                        </div>`;
    });
    template.innerHTML = htmlString;
    const documentFragment = document.createDocumentFragment();
    [...template.content.childNodes].forEach((node) => {
      documentFragment.appendChild(node);
    });
    $left_summary.appendChild(documentFragment);
  });
  //첫번째 사람 클릭 이벤트
  [...$left_summary.querySelectorAll("a")][1].click(); //첫번째 a 태그 클릭
}

var unsubscribe;

var profileImageMap = new Map(); //각 문서 key는 문서명(유저 uid), 값은 커스텀 객체(docId 프로퍼티가 추가된)
var usersInfoMap = new Map(); //각 문서 key는 문서명(유저 uid), 값은 커스텀 객체(docId 프로퍼티가 추가된)
const postingMap = new Map(); //각 문서 key는 유저 uid, 값은 배열 ( 해당 유저가 쓴 글 문서 모음 )
function initFirestoreDBOperation() {
  db.collection("usersInfo")
    .withConverter(my_custom_vars.infoUserConverter)
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        //usersInfo는 현재 유저가 있으므로 최소 1개 이상 존재함
        var userInfoDTO = doc.data();
        userInfoDTO.docId = doc.id;
        usersInfoMap.set(doc.id, userInfoDTO);
      });
      sayHelloToUser();
      db.collection("profileImages")
        .withConverter(my_custom_vars.profileImageConverter)
        .get()
        .then((querySnapshot2) => {
          //이 중괄호 안 profile콜렉션 문서가 1장도 없어도 작동함...
          querySnapshot2.forEach((doc2) => {
            var profileImageDTO = doc2.data();
            profileImageDTO.docId = doc2.id;
            profileImageMap.set(doc2.id, profileImageDTO);
          });
          db.collection("images")
            .orderBy("timestamp", "desc")
            .withConverter(my_custom_vars.contentDTOConverter)
            .get()
            .then((querySnapshot3) => {
              querySnapshot3.forEach((doc3) => {
                const postingDTO = doc3.data();
                postingDTO.docId = doc3.id; //images 콜렉션에 무작위로 생성된 문서의 uid를 일단 프로퍼티로 추가해줌( 필요한 경우 대비 )
                if (!postingMap.has(postingDTO.uid)) {
                  //해당 유저 uid가 key로 존재하지 않는다면
                  postingMap.set(postingDTO.uid, [postingDTO]);
                } else {
                  //이미 해당유저uid로 map에 들어가 있는 거라면 배열에 추가
                  postingMap.get(postingDTO.uid).push(postingDTO);
                }
              });
              //각종 화면 표시 펑션
              showStudentListWithArticleNumber(); //왼쪽 :반 별 학생 목록과 개별 글 업로드 수
              hideLoading(); // 여기서 비로소 화면 로딩표시 사라짐

              my_custom_vars.changeIconIfExistRecentNotice(); //신규 공지사항 확인 후 icon 교체
            })
            .catch((error3) => {
              my_custom_vars.showSwalErrorMessage_db(error3);
            });
        })
        .catch((error) => {
          my_custom_vars.showSwalErrorMessage_db(error);
        });
    })
    .catch((error2) => {
      my_custom_vars.showSwalErrorMessage_db(error2);
    });
}

// initialize Firebase
initFirebaseAuth();

$(document).ready(function () {
  //탈퇴 버튼
  $("#a_quit_account_btn").click(my_custom_vars.userDeleteAccount); //함수뒤에 ()붙이지 말것. 바로 실행됨
  //로그아웃 버튼
  $("#logout_btn").click(my_custom_vars.userLogout);
});
