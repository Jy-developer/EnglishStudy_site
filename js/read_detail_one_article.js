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

$(document).ready(function () {
  $("#div_edit_del_article_btn > div").hide(); //자신 글 확인 후 수정삭제 버튼 토글(초기 hide)
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

//비어있거나 공백인 문자열인 경우 -> true 반환
function isBlankOrEmptyString(str) {
  return !str || !str.toString().trim();
}

function printDateFromSystemMilliseconds(milliSeconds) {
  return moment(milliSeconds).format("YYYY.M.D.");
}

function returnDifferentIconIfClickedFavorite(favoriteMap) {
  if (!(firebase.auth().currentUser.uid in favoriteMap)) {
    return '<span class="far fa-thumbs-up mr-2 animate-up-2"></span>';
  } else {
    //이미 내 uid가 들어있음. 좋아요 눌러져 있음
    return '<span class="fas fa-thumbs-up mr-2"></span>';
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

function getSelfIntroOrDefaultValue(obj) {
  var result = obj.selfIntro
    ? obj.selfIntro
    : "You haven't introduced yourself yet";
  return result;
}

//왼쪽 사이드바 프로필 카드 내용 채우기
function decorateProfileCard() {
  $("#img_profile_card_img").attr(
    "src",
    getProfileImgOrDefaultValue(
      profileImageMap.get(my_custom_vars.getParameters("u"))
    )
  ); //화면왼쪽 프로필카드 이 글쓴이의 얼굴
  $("#img_profile_card_img").css(
    "object-fit",
    setOptionCoverOrContainByExistenceProfileImg(
      profileImageMap.get(my_custom_vars.getParameters("u"))
    )
  ); //이미지 있으면 cover꽉차게, 없으면 contain으로
  $("#img_profile_card_img")
    .parent()
    .parent()
    .on("click", function () {
      window.location.href = `/see_profile.html?index=${my_custom_vars.getParameters(
        "u"
      )}&mail=${this_article.userId}`;
    });
  $("#h3_profile_card_name").text(
    filterXSS(usersInfoMap.get(my_custom_vars.getParameters("u")).name)
  ); //프로필 카드 이름
  //프로필 카드 자기 소개
  $("#p_profile_selfIntro").text(
    filterXSS(
      getSelfIntroOrDefaultValue(
        usersInfoMap.get(my_custom_vars.getParameters("u"))
      )
    )
  );
  //프로필 사진 젤 아래 메일송신 클릭 가능한 아이콘(프로바이더는 타유저 것은 알수없음)
  $("#a_provider_show_email_btn").attr("href", "mailto:" + this_article.userId);
  $("#a_provider_show_email_btn").append(
    `<span class="fas fa-envelope"></span>`
  );

  //프로필 카드 배지 표시
  var writer_user_obj = usersInfoMap.get(my_custom_vars.getParameters("u"));
  var conditions = [
    writer_user_obj.isFirstWritingEventTriggered,
    writer_user_obj.isHalfClearEventTriggered,
    writer_user_obj.isAllClearEventTriggered,
    writer_user_obj.isOnlyOneFirstExplorerEventTriggered,
    writer_user_obj.isLongWriterEventTriggered,
    writer_user_obj.isMaxPhotoUploadEventTriggered,
  ];
  var cleared_condition = []; //true 인 조건의 인덱스만 들어 있음 ( 0, 2, 3, ..등으로 )
  for (let i = 0; i < conditions.length; i++) {
    if (conditions[i] == true) cleared_condition.push(i);
  }
  for (let i = 0; i < cleared_condition.length; i++) {
    $("#ul_profile_badge").append(`
        <li>
            <a aria-label="" class="icon icon-xs mr-1" data-bs-toggle="tooltip" data-placement="bottom" title="${
              my_custom_vars.badgeTitles[cleared_condition[i]]
            }" data-original-title="${
      my_custom_vars.badgeTitles[cleared_condition[i]]
    }">${my_custom_vars.badgeIconsSmall[cleared_condition[i]]}</a>
        </li>
        `);
  }

  // 덧글 남기기 버튼 리스너 여기서 설정. decorateProfileCard는 이미 db셋업 이후 실행되므로
  $("#btn_send_comment").click(function () {
    if (isBlankOrEmptyString($("#txtarea_comment").val())) {
      swal("", "The content is blank.", "warning");
      return;
    }
    var comment_obj = new my_custom_vars.CommentDTO();
    comment_obj.comment = $("#txtarea_comment").val();
    comment_obj.timestamp = new Date().getTime() + ""; //timestamp 는 이미 문자열
    comment_obj.uid = firebase.auth().currentUser.uid;
    comment_obj.userId = firebase.auth().currentUser.email;
    comment_obj.name = usersInfoMap.get(firebase.auth().currentUser.uid).name;
    comment_obj.comment_attached_docid = this_article.docId; //댓글이 달리는 images콜렉션 문서의 docId

    db.collection("images")
      .doc(this_article.docId)
      .collection("comments")
      .doc()
      .withConverter(my_custom_vars.commentConverter)
      .set(comment_obj)
      .then(() => {
        $("#txtarea_comment").val(""); //코멘트 입력란 clear
      })
      .catch((error) => {
        my_custom_vars.showSwalErrorMessage_db(error);
      });
  });
}

//가운데 일기 내용 채우기
function showArticleContent() {
  $("#h1_article_title").text(filterXSS(this_article.title)); //글 제목
  //현재 DB구조가 유튜브 영상이나, 사진이 한장짜리 인 경우에 imageArr이 비어있고, imageUrl만 있기 때문에
  // carousel 의 img는 첫 장만 따로 코딩함.
  // var heightPixel = window.screen.height * window.devicePixelRatio;
  var heightPixel = window.screen.height;
  $("#carousel_pic_basket").append(`
            <div class="carousel-item active" style="height: ${
              heightPixel / 2
            }px;">
                <img class="d-block" style="cursor:zoom-in; margin: auto; position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: auto; height: auto; max-height: ${
                  heightPixel / 2
                }px" src="${
    this_article.imageUrl
  }" alt="" onload="hideLoading();">                
            </div>
    `);
  //오버레이 쪽 이미지 붙이기
  $("#overlay_carousel").append(`
    <div class="carousel-item active">
        <div class="d-flex align-items-center justify-content-center" style="height: ${heightPixel}px;">
            <img class="d-block" style="max-height:100%; min-height:65%; object-fit:contain; cursor: zoom-out;" src="${this_article.imageUrl}" alt=""> 
        </div>
    </div>    
    `);
  for (let i = 1; i < this_article.imageArr.length; i++) {
    $("#carousel_pic_basket").append(`
            <div class="carousel-item" style="height: ${heightPixel / 2}px;">
                <img class="d-block" style="cursor:zoom-in; margin: auto; position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: auto; height: auto; max-height: ${
                  heightPixel / 2
                }px" src="${this_article.imageArr[i]}" alt="">                
            </div>
        `);
    //오버레이 쪽
    $("#overlay_carousel").append(`
        <div class="carousel-item">
            <div class="d-flex align-items-center justify-content-center" style="height: ${heightPixel}px;">
                <img class="d-block" style="max-height:100%; min-height:65%; object-fit:contain; cursor: zoom-out;" src="${this_article.imageArr[i]}" alt=""> 
            </div>
        </div>    
        `);
  }
  //이미지 눌렀을 때 오버레이 실행
  $(".carousel-item > img").on("click", function (e) {
    e.preventDefault();
    // $('.overlay').toggleClass('active');
    // $('.content').toggleClass('smaller');
    $(".overlay").addClass("active");
    $(".content").addClass("smaller");
    my_custom_vars.openFullscreen();
  });
  //오버레이에서 원래 read 화면으로 back
  $("#overlay_carousel img").on("click", function (e) {
    e.preventDefault();
    $(".overlay").removeClass("active");
    $(".content").removeClass("smaller");
    my_custom_vars.closeFullscreen();
  });
  //풀 스크린 모드를 끄는 이벤트가 발생시 실행할 펑션
  document.addEventListener("fullscreenchange", (event) => {
    if (document.fullscreenElement) {
      //풀스크린 모드 들어오면 실행할 동작
    } else {
      //오버레이 모드 들어온 상황에서 esc 등 눌러서 풀스크린 모드 나가면
      if ($(".overlay").hasClass("active")) {
        $(".content").removeClass("smaller");
        $(".overlay").removeClass("active");
      }
    }
  });

  //오버레이와 실 card화면에서 next, previous 동시 클릭 처리
  $("#overlay_carousel_outer").on("slide.bs.carousel", function (e) {
    //e가 이벤트
    if ($("#div_overlay").hasClass("active")) {
      //이게 구분안되면, 되돌이 현상으로 작동이 안됨 A->B->A->B...무한
      $("#pic_Carousel").carousel(e.to);
    }
  });
  //실 card화면에서 index 버튼으로 사진 이동시, 오버레이쪽 carousel 이동
  $("#pic_Carousel").on("slide.bs.carousel", function (e) {
    //e가 이벤트
    if (!$("#div_overlay").hasClass("active")) {
      $("#overlay_carousel_outer").carousel(e.to);
    }
  });
  //carousel indicator ( 이건 위와 달리 0부터 index 시작)
  for (let i = 0; i < this_article.imageArr.length; i++) {
    $("#ol_carousel_indicator").append(`
            <li data-target="#pic_Carousel" data-slide-to="${i}"></li>
        `);
  }
  $("#ol_carousel_indicator li:first-child").addClass("active");
  //메인 일기 프로필카드 글쓴이 얼굴
  $("#img_small_profile_img").attr(
    "src",
    getProfileImgOrDefaultValue(
      profileImageMap.get(my_custom_vars.getParameters("u"))
    )
  );
  $("#img_small_profile_img")
    .parent()
    .on("click", function () {
      window.location.href = `/see_profile.html?index=${my_custom_vars.getParameters(
        "u"
      )}&mail=${this_article.userId}`;
    });
  //가운데 글 위에 표시되는 이름
  $("#p_article_small_name").text(
    filterXSS(usersInfoMap.get(my_custom_vars.getParameters("u")).name)
  );
  //golden ticket diary인 경우
  if (rotaryWonImagesMap.has(my_custom_vars.getParameters("index"))) {
    $(".flex-grow-1").after(`
        <img src="/img/badge/golden_badge_lottery_won.png" style="position: relative; width: 3rem; height: 3rem;" class="g_ticket_badge mr-3" alt="${my_custom_vars.rotaryRelatedString[6]}" data-toggle="tooltip" data-placement="top" data-original-title="${my_custom_vars.rotaryRelatedString[6]}">
        `);
    $('img[data-toggle="tooltip"]').tooltip({
      //img태그의 tooltip을 정상작동하게 해주는 소중한 코드 !!
      container: "body",
    });
  }

  $("#p_article_content").text(filterXSS(this_article.explain)); //글 내용
  // 글 작성 날짜 표시
  $("#span_writing_date").html(
    `<span class="far fa-calendar-alt mr-2"></span>${printDateFromSystemMilliseconds(
      this_article.timestamp
    )}`
  );

  //자기 글이냐 따라 수정 및 삭제 버튼 토글
  if (firebase.auth().currentUser.uid == this_article.uid) {
    $("#div_edit_del_article_btn > div").show();
    //수정 버튼에 링크 부착
    $("#a_edit_post").on("click", function () {
      window.location.href = `/editing_article.html?index=${this_article.docId}`;
    });
    //삭제 기능
    $("#a_delete_post").click(function () {
      swal({
        title: "Are you sure to delete your diary?",
        text: "This action can not be un-​done.",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((willDelete) => {
        if (willDelete) {
          showLoading();
          var contentDTO = this_article;
          //storage 파일 삭제 -> 사실, db 정리 끝나고, 바로 html페이지 이동해버리면, storage파일 안 지워지고 남음
          //video 인 경우, imageArr이 비어 있고, imageUrl만 있음
          if (contentDTO.imageFileName.startsWith("VIDEO")) {
            var thumbFileName = contentDTO.imageFileName.replace(
              "_.mp4",
              "_cover.png"
            );
            storage
              .ref(
                "images/thumbnail/" +
                  firebase.auth().currentUser.uid +
                  "/" +
                  thumbFileName
              )
              .delete();
          } else {
            //사진첩 일기인 경우 ( 1장 일기는 무시 )
            for (let i = 0; i < contentDTO.imageArr.length; i++) {
              let str = contentDTO.imageArr[i];
              str = str.split("JPEG")[1].split("_.png")[0];
              str = "JPEG" + str + "_.png";
              storage
                .ref("images/" + firebase.auth().currentUser.uid + "/" + str)
                .delete()
                .then(function () {
                  //삭제 성공
                })
                .catch(function (error) {
                  hideLoading();
                  my_custom_vars.showSwalErrorMessage_storage(error);
                  return;
                });
            }
          }
          //firestore DB 삭제. ( comments 컬렉션은 한 학기 끝나고 최상위 콜렉션 삭제시 하위 콜렉션도 자동 삭제됨 )
          db.collection("images")
            .doc(this_article.docId)
            .delete()
            .then(() => {
              window.location.href = "/list_cardUI.html";
            })
            .catch((error) => {
              hideLoading();
              my_custom_vars.showSwalErrorMessage_db(error);
            });
        } else {
          swal("Your job has been cancelled.");
        }
      });
    });
  } else {
    //기본값이 hide므로 do nothing
  }

  //좋아요 버튼 표시 및 리스너 설정
  $("#div_parent_favor_count_btn").append(`
        <button class="btn btn-sm btn-primary animate-hover mr-2" id="btn_favor_count">
            ${returnDifferentIconIfClickedFavorite(this_article.favorites)}
            ${this_article.favoriteCount}
        </button>
    `);
  $("#btn_favor_count").click(function () {
    if ($(this).children("span").hasClass("animate-up-2") === false) {
      //이미 좋아요 눌러서, 해당 클래스가 없다면
      return; //do nothing
    }
    //따라서 이하 코드는, 무조건 좋아요가 추가가 되는 코드여야 한다.
    var imageRef = db.collection("images").doc(this_article.docId);
    return db
      .runTransaction((transaction) => {
        return transaction.get(imageRef).then((imgDoc) => {
          if (!imgDoc.exists) {
            swal(
              "Error",
              "Diary does not exist or a server error has occurred.",
              "error"
            );
            return;
          }
          var contentDTO = imgDoc.data();

          if (!(firebase.auth().currentUser.uid in contentDTO.favorites)) {
            contentDTO.favoriteCount = contentDTO.favoriteCount + 1;
            contentDTO.favorites[firebase.auth().currentUser.uid] = true;
            transaction.update(imageRef, contentDTO);
          } else {
            //위에서 좋아요 이미 누른사람 걸러서 여기 올 일이 없음
          }
        });
      })
      .then(() => {
        //좋아요 버튼 숫자의 변경은, 수동적으로 처리하며, 현재 가지고 있는 숫자+1 함
        var count = +$(this).text(); //숫자화
        $(this).empty();
        $(this).append(`
                <span class="fas fa-thumbs-up mr-2"></span>${count + 1}
             `);
      })
      .catch((error) => {
        my_custom_vars.showSwalErrorMessage_db(error);
      });
  });

  //새로 덧글 다는 유저 프로필 이미지
  $("#img_current_user_profile").attr(
    "src",
    getProfileImgOrDefaultValue(
      profileImageMap.get(firebase.auth().currentUser.uid)
    )
  );
  //가장 아래 새로 덧글 다는 본인 이름
  $("#th_current_user_name").text(
    filterXSS(usersInfoMap.get(firebase.auth().currentUser.uid).name)
  );

  //글 가장 하단 이전, 다음 글 리스너 부착
  if (prev_next_article_arr[0]) {
    $("#btn_prev_article").on("click", function () {
      window.location.href = `/read_detail_one_article.html?index=${prev_next_article_arr[0].docId}&u=${prev_next_article_arr[0].uid}`;
    });
  } else {
    //undefined 일때
    $("#btn_prev_article").prop("disabled", true);
  }
  if (prev_next_article_arr[1]) {
    $("#btn_next_article").on("click", function () {
      window.location.href = `/read_detail_one_article.html?index=${prev_next_article_arr[1].docId}&u=${prev_next_article_arr[1].uid}`;
    });
  } else {
    //undefined 일때
    $("#btn_next_article").prop("disabled", true);
  }

  hideLoading();
}

//오른쪽 일기 월별 목록 채우기
var result_grouped_obj = {};
function posting_groupByMonth() {
  result_grouped_obj = {};
  var grouping = function (x) {
    var key = moment(x.timestamp).format("yyyy.MM");
    if (result_grouped_obj[key] === undefined) {
      result_grouped_obj[key] = [];
    }
    result_grouped_obj[key].push(x);
  };
  _.map(postingArray, grouping);
  for (month_key in result_grouped_obj) {
    $("#ul_right_sidebar").append(`
            <li class="bd-sidenav-group my-1 js-sidenav-group has-children">
                <a class="d-inline-flex align-items-center bd-sidenav-group-link" style="cursor:default;">
                    ${month_key}
                </a>
                <ul class="nav bd-sidenav flex-column mb-2">
                </ul>
            </li>
        `);
    for (let i = 0; i < result_grouped_obj[month_key].length; i++) {
      const contentDTO = result_grouped_obj[month_key][i];
      $("#ul_right_sidebar > li:last-child ul").append(`
                <li><a class="a_my_prev_article" u-id="${
                  contentDTO.uid
                }" d-id="${contentDTO.docId}">${filterXSS(
        contentDTO.title
      )}</a></li>
            `);
    }
  }
  $(".a_my_prev_article").on("click", function () {
    window.location.href = `/read_detail_one_article.html?index=${$(this).attr(
      "d-id"
    )}&u=${$(this).attr("u-id")}`;
  });
}
var unsubscribe;
var commentMap = new Map();
function addListnerToCommentsDB() {
  unsubscribe = db
    .collection("images")
    .doc(this_article.docId)
    .collection("comments")
    .orderBy("timestamp")
    .withConverter(my_custom_vars.commentConverter)
    .onSnapshot((querySnapshot) => {
      commentMap.clear();
      querySnapshot.forEach((doc) => {
        var commentDTO = doc.data();
        commentDTO.docId = doc.id;
        commentMap.set(doc.id, commentDTO);
      });
      //comment DB 세팅 끝났으면
      // 댓글 개수 나타내는 count 갱신
      $("#a_comment_count").empty();
      $("#a_comment_count").html(
        `<span class="far fa-comments mr-2"></span>${commentMap.size}`
      );

      // 댓글 줄줄이 붙은 댓글표 갱신
      $("#commentTable tbody").empty();
      // for (let key in commentMap) {
      for (const [key, value] of commentMap.entries()) {
        if (value.uid == firebase.auth().currentUser.uid) {
          //자기 댓글이면
          $("#tbody_comment_table").append(`
                            <tr>
                                <th class="border-0" style="width: 15%;">
                                    <!-- 추후 여기에 프로필 가는 링크 넣을 것 -->
                                    <a data-toggle="tooltip" data-placement="bottom" title="" data-original-title="" class="a_each_comment" index="${
                                      value.uid
                                    }" mail="${value.userId}">
                                        <img class="my_avatar-3 mr-2 img-fluid rounded-circle" src="${getProfileImgOrDefaultValue(
                                          profileImageMap.get(
                                            firebase.auth().currentUser.uid
                                          )
                                        )}" alt="">
                                    </a>
                                </th>
                                <th class="font-weight-bold" style="width: 15%;">${filterXSS(
                                  value.name
                                )}</th>
                                <td style="width: 60%;" class="td_cell_comment">${filterXSS(
                                  value.comment
                                )}</td>
                                <td style="width: 10%;" class="td_comment_del_btn"><a class="a_del_comment_btn" index="${key}"><img src="/img/comment-delete-btn.png" style="max-width:24px;"></a></td>
                            </tr>        
                        `);
        } else {
          //남의 댓글이면
          $("#tbody_comment_table").append(`
                            <tr>
                                <th class="border-0" style="width: 15%;">
                                    <!-- 추후 여기에 프로필 가는 링크 넣을 것 -->
                                    <a data-toggle="tooltip" data-placement="bottom" title="Go to profile" data-original-title="Go to profile" class="a_each_comment" index="${
                                      value.uid
                                    }" mail="${value.userId}">
                                        <img class="my_avatar-3 mr-2 img-fluid rounded-circle" src="${getProfileImgOrDefaultValue(
                                          profileImageMap.get(value.uid)
                                        )}" alt="">
                                    </a>
                                </th>
                                <th class="font-weight-bold" style="width: 15%;">${filterXSS(
                                  value.name
                                )}</th>
                                <td style="width: 70%;" class="td_cell_comment" colspan="2">${filterXSS(
                                  value.comment
                                )}</td>                
                            </tr>
                        `);
        }
      }
      $(".a_each_comment").on("click", function () {
        window.location.href = `/see_profile.html?index=${$(this).attr(
          "index"
        )}&mail=${$(this).attr("mail")}`;
      });

      //댓글 삭제 버튼 클릭이벤트 리스너 정의
      $(".a_del_comment_btn").click(function () {
        db.collection("images")
          .doc(this_article.docId)
          .collection("comments")
          .doc($(this).attr("index"))
          .delete()
          .then(() => {
            //어차피 리스너에서 실행하는 것이므로, 자동 댓글 테이블 갱신됨
          })
          .catch((error) => {
            my_custom_vars.showSwalErrorMessage_db(error);
          });
      });
    });
}

var this_article = undefined; //지금 보고 있는 글 한개 객체 가 담김
var postingArray = []; // 해당 유저 글이 모두 담겨 있음(timestamp -desc 순)
var profileImageMap = new Map(); //각 문서 key는 문서명(유저 uid), 값은 커스텀 객체(docId 프로퍼티가 추가된)
var usersInfoMap = new Map(); //각 문서 key는 문서명(유저 uid), 값은 커스텀 객체(docId 프로퍼티가 추가된)
//유저 앞뒷글 표시 하기 위한 변수들 세팅
var prev_next_article_arr = []; //최종적 앞, 뒷 글 담을 배열 ( 없어도 undefined가 담기고 무조건 length는 2 )
var prev_article = []; //일단 현재 글 앞의 모든 글 담음
var next_article = []; //일단 현재 글 뒤의 모든 글 담음
var flagNextThisArticle = false; //현재 글인지 아닌지 확인하는 boolean 플래그
var rotaryWonImagesMap = new Map(); //Golden ticket 당첨된 글들 docId 모은 Map ( 키와 값이 동일 -> docId )
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
              var writer_uid = my_custom_vars.getParameters("u");
              var thisDocId = my_custom_vars.getParameters("index");
              var myClass = usersInfoMap.get(
                firebase.auth().currentUser.uid
              ).relation; //글쓴이 class
              querySnapshot3.forEach((doc3) => {
                if (usersInfoMap.get(doc3.data().uid).relation == myClass) {
                  //같은 반인 글만 고르고
                  if (!flagNextThisArticle && doc3.id != thisDocId) {
                    var prev_article_obj = doc3.data();
                    prev_article_obj.docId = doc3.id;
                    prev_article.push(prev_article_obj);
                  } else if (doc3.id == thisDocId) {
                    flagNextThisArticle = true;
                  } else {
                    var next_article_obj = doc3.data();
                    next_article_obj.docId = doc3.id;
                    next_article.push(next_article_obj);
                  }
                  if (doc3.data().uid == writer_uid) {
                    //지금 글의 글쓴이가 쓴 글만 골라 담음 (for grouping)
                    var contentDTO_plus_docId = doc3.data();
                    contentDTO_plus_docId.docId = doc3.id;
                    postingArray.push(contentDTO_plus_docId);

                    if (doc3.id == thisDocId) {
                      //지금 글 하나의 정보만 담음
                      this_article = doc3.data();
                      this_article.docId = doc3.id;
                    }
                  }
                }
              });
              prev_next_article_arr.push(prev_article[prev_article.length - 1]); //앞 글
              prev_next_article_arr.push(next_article[0]); //뒷 글
              //같은 반 학생들 글 중에 현재 글 앞 뒤에 있는 글 2개 뽑기

              db.collection("goldenTicketImages")
                .get()
                .then((query) => {
                  query.forEach((document) => {
                    rotaryWonImagesMap.set(
                      document.data().docid,
                      document.data().docid
                    );
                  });
                  //각종 화면 표시 펑션
                  decorateProfileCard(); //왼쪽 프로필
                  showArticleContent(); //가운데 일기
                  posting_groupByMonth(); //오른쪽 그룹핑

                  addListnerToCommentsDB(); //comments에 대한 Listener 부착
                  my_custom_vars.changeIconIfExistRecentNotice(); //신규 공지사항 확인 후 icon 교체
                });
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
