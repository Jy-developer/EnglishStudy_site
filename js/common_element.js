// This doc is prepared for common variables and classes.
// Use this for Refactoring.
var my_custom_vars = {
  //이번 2022-1학기 영어수업의 일기쓰기를 시작해야 하는 날짜 ( 매 학기 수정 필요 )
  englishDiaryStartDay: [
    "2022-04-18 00:00:00",
    "2022-04-13 00:00:00",
    "2022-04-14 00:00:00",
    "2022-04-08 00:00:00",
  ],
  //관리자 이메일 주소
  adminEmail: "julie.jsyang@gmail.com", //현재 관리자 메일은 교수님 메일로 설정함
  classNameDefaultValue: "Choose your Class...",
  //반 이름을 어떻게 정하든 여기서 수정할 것 (매 학기 수정 필요 )
  classNameList: [
    "Monday, 2 University English (月2)",
    "Wednesday, 2 University English (水2)",
    "Thursday, 5 Media English (木5)",
    "Friday, 4 Academic English (金4)",
  ],
  //배지 이름 및 설명  1.첫 글  2.중간완료  3.글전부완료  4.서버 첫글(only)  5.긴글 작성   6.사진10장max
  badgeTitles: [
    "starter",
    "intermediate",
    "perfect",
    "first explorer",
    "storyteller",
    "photographer",
  ],
  badgeComments: [
    "Journal writing is a voyage to the interior. Enjoy the journey!",
    "Believe you can and You're half way there.",
    "You've made it! Congratulations!",
    "First come, first served. None of others could earn this badge.",
    "Your life is, after all, your stories.",
    "I don't trust words; I trust pictures.",
  ],
  badgeIcons: [
    '<i class="bi bi-sunrise" style="font-size:2.5rem"></i>',
    '<i class="bi bi-signpost-split" style="font-size:2.5rem"></i>',
    '<i class="bi bi-emoji-heart-eyes" style="font-size:2.5rem"></i>',
    '<i class="bi bi-gem" style="font-size:2.5rem"></i>',
    '<i class="bi bi-vector-pen" style="font-size:2.5rem"></i>',
    '<i class="bi bi-camera-fill" style="font-size:2.5rem"></i>',
  ],
  badgeIconsSmall: [
    '<i class="bi bi-sunrise" style="font-size:1.5rem"></i>',
    '<i class="bi bi-signpost-split" style="font-size:1.5rem"></i>',
    '<i class="bi bi-emoji-heart-eyes" style="font-size:1.5rem"></i>',
    '<i class="bi bi-gem" style="font-size:1.5rem"></i>',
    '<i class="bi bi-vector-pen" style="font-size:1.5rem"></i>',
    '<i class="bi bi-camera-fill" style="font-size:1.5rem"></i>',
  ],
  infoUserBadgeFieldName: [
    "isFirstWritingEventTriggered",
    "isHalfClearEventTriggered",
    "isAllClearEventTriggered",
    "isOnlyOneFirstExplorerEventTriggered",
    "isLongWriterEventTriggered",
    "isMaxPhotoUploadEventTriggered",
  ],
  rotaryRelatedString: [
    "This week's draw ends", //해당 주 당첨자가 이미 나왔을 때 모달 타이틀. "이번 주 응모 종료"
    "Thank you for writing. Unfortunately, this week's Golden Ticket draw has ended. Try your luck next week!", //해당 주 당첨자가 이미 나왔을 때 모달 내용=> '글을 써주셔서 감사합니다~ 아쉽게도 이번 주의 골든 티켓 추첨은 모두 끝났습니다. 다음 주의 행운을 노려보세요~'
    "Golden ticket challenge", //룰렛 돌리는 모달 타이틀
    "Let's Roll", // 룰렛 돌리는 모달 버튼 text
    "I'm sorry, unfortunately you didn't win", //룰렛 실패 시 모달 가운데 내용 문자열. 인덱스 4 => '안타깝네요 아쉽게도 꽝입니다'
    "Congratulations!! You have won a Golden ticket!!", //룰렛 성공시 모달 가운데 내용 문자내용. 인덱스5 => '축하합니다!! Golden ticket을 획득하셨습니다!!'
    "This week's Golden ticket diary", //G골든티켓 아이콘 위에 툴팁으로 뜨는 메시지. 인덱스 6
  ],
  rotaryWritingArticleLeastTimeLimit: 3600000, //rotary 돌리기위해 최소 대기해야 하는 시간(1시간)
  articleCountToUploadInOneSemester: 13, //한 학기당 올려야 하는 글 개수
  newNoticeStandardMilliSecond: 259200000, //신규 공지사항으로 인정하는 밀리초. ( 현재 3일의 시간 )
  db: firebase.firestore(),

  // Notices( Announcement ) 에 3일 이내 신규공지사항이 있으면 Top navbar 아이콘 바꿔주는 메소드
  changeIconIfExistRecentNotice: function () {
    my_custom_vars.db
      .collection("notices")
      .orderBy("timestamp", "desc")
      .withConverter(my_custom_vars.noticeConverter)
      .get()
      .then((querySnapshot) => {
        var recentNoticeInThreeDaysCount = 0;
        for (var i in querySnapshot.docs) {
          const doc = querySnapshot.docs[i];
          var noticeDTO = doc.data();
          if (
            new Date().getTime() - Number(noticeDTO.timestamp) <
            my_custom_vars.newNoticeStandardMilliSecond
          ) {
            //3일 내 최신 글이 있다면
            recentNoticeInThreeDaysCount++;
          } else {
            //최신순으로 검토하는데 현재 글이 3일 이내가 아니라면, 뒤에 doc은 볼 필요 없으므로
            break; //for문 탈출
          }
          if (recentNoticeInThreeDaysCount >= 4) {
            //계속 최신글이 있지만 그것도 4개 이상이면 의미없으므로
            break; //for문 탈출
          }
        }
        switch (recentNoticeInThreeDaysCount) {
          case 0:
            //3일 내 공지사항이 없으므로 do nothing
            break;
          case 1:
            $("a[data-original-title=Announcement]").empty();
            $("a[data-original-title=Announcement]").css(
              "transform",
              "translateY(-4px)"
            );
            $("a[data-original-title=Announcement]").append(`
                        <img src="/img/alarm_count_icon/notice_alarm_1.svg" style="opacity: 1; width: 2rem; height: 2rem;">
                        `);
            break;
          case 2:
            $("a[data-original-title=Announcement]").empty();
            $("a[data-original-title=Announcement]").css(
              "transform",
              "translateY(-4px)"
            );
            $("a[data-original-title=Announcement]").append(`
                        <img src="/img/alarm_count_icon/notice_alarm_2.svg" style="opacity: 1; width: 2rem; height: 2rem;">
                        `);
            break;
          case 3:
            $("a[data-original-title=Announcement]").empty();
            $("a[data-original-title=Announcement]").css(
              "transform",
              "translateY(-4px)"
            );
            $("a[data-original-title=Announcement]").append(`
                        <img src="/img/alarm_count_icon/notice_alarm_3.svg" style="opacity: 1; width: 2rem; height: 2rem;">
                        `);
            break;
          default:
            $("a[data-original-title=Announcement]").empty();
            $("a[data-original-title=Announcement]").css(
              "transform",
              "translateY(-4px)"
            );
            $("a[data-original-title=Announcement]").append(`
                        <img src="/img/alarm_count_icon/notice_alarm_morethan_3.svg" style="opacity: 1; width: 2rem; height: 2rem;">
                        `);
            break;
        }
      })
      .catch((error) => {
        my_custom_vars.showSwalErrorMessage_db(error);
      });
  },
  showSwalErrorMessage_db: function (error) {
    switch (error.code) {
      case "cancelled":
        //swal(타이틀, 메시지, "아이콘-> warning, error, success, info 중 택일")
        //버튼메시지까지 바꾸고 싶으면, 뒷부분 "아이콘", {button:"버튼문구",}) 할 것
        swal(
          "",
          "The operation was cancelled (typically by the caller)",
          "error"
        );
        break;
      case "unknown":
        swal(
          "",
          "Unknown error or an error from a different error domain.",
          "error"
        );
        break;
      case "invalid-argument":
        swal("", "Client specified an invalid argument.", "error");
        break;
      case "deadline-exceeded":
        swal("", "Deadline expired before operation could complete.", "error");
        break;
      case "not-found":
        swal("", "Some requested document was not found.", "error");
        break;
      case "already-exists":
        swal(
          "",
          "Some document that we attempted to create already exists.",
          "error"
        );
        break;
      case "permission-denied": //실제로는 대부분 인증번호 제대로 안 넣어서 여기서 걸림
        swal(
          "",
          "The caller does not have permission to execute the specified operation.",
          "error"
        );
        break;
      case "resource-exhausted":
        swal("", "Some resource has been exhausted.", "error");
        break;
      case "failed-precondition":
        swal("", "Operation was rejected.", "error");
        break;
      case "aborted":
        swal("", "The operation was aborted.", "error");
        break;
      case "out-of-range":
        swal("", "Operation was attempted past the valid range.", "error");
        break;
      case "unimplemented":
        swal(
          "",
          "Operation is not implemented or not supported/enabled.",
          "error"
        );
        break;
      case "internal":
        swal("", "Internal errors.", "error");
        break;
      case "unavailable":
        swal("", "The service is currently unavailable.", "error");
        break;
      case "data-loss":
        swal("", "Unrecoverable data loss or corruption.", "error");
        break;
      case "unauthenticated":
        swal(
          "",
          "The request does not have valid authentication credentials for the operation.",
          "error"
        );
        break;
      default:
        break;
    }
  },
  showSwalErrorMessage_storage: function (error) {
    switch (error.code) {
      case "storage/unauthorized":
        // User doesn't have permission to access the object
        swal("", "An unknown error occurred.", "error");
        break;
      case "storage/canceled":
        // User canceled the upload
        swal("", "User canceled the operation.", "error");
        break;
      case "storage/unknown":
        // Unknown error occurred, inspect error.serverResponse
        swal("", "An unknown error occurred.", "error");
        break;
    }
  },
  userLogout: function () {
    firebase
      .auth()
      .signOut()
      .then((e) => {
        window.top.location.replace("/index.html");
      })
      .catch();
  },
  userDeleteAccount: function () {
    swal({
      title: "Are you leaving English Diary?",
      text: "You cannot revise or delete your diaries after.",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((willQuit) => {
      if (willQuit) {
        const user = firebase.auth().currentUser;
        var db = firebase.firestore();
        db.collection("usersInfo")
          .doc(user.uid)
          .set({ quit: true }, { merge: true })
          .then(() => {
            user
              .delete()
              .then(() => {
                swal({
                  title: "We have deleted your account.",
                  text: "Thank you for contribution to English Diary.",
                  icon: "success",
                }).then(() => {
                  setTimeout(function () {
                    window.top.location.replace("/index.html");
                  }, 2500);
                });
              })
              .catch((error) => {
                my_custom_vars.showSwalErrorMessage_db(error);
              });
          })
          .catch((error2) => {
            my_custom_vars.showSwalErrorMessage_db(error2);
          });
      } else {
        swal("You have canceled your account deletion.");
      }
    });
  },
  sendMailToAdmin: function () {
    window.open(`mailto:${my_custom_vars.adminEmail}`);
  },

  toGallery: function () {
    window.location.href = "/list_cardUI.html";
  },
  toWriteArticle: function () {
    window.location.href = "/writing_article.html";
  },
  toNotice: function () {
    window.location.href = "/bulletin_board.html";
  },
  toMyProfile: function () {
    window.location.href = "/edit_my_profile.html";
  },
  getParameters: function (paramName) {
    var returnValue; // 리턴값을 위한 변수 선언
    var url = window.location.href; // 현재 URL 가져오기. frame에서 실행되어도 잘 가져옴

    // get 파라미터 값을 가져올 수 있는 ? 를 기점으로 slice 한 후 split 으로 나눔
    var parameters = url.slice(url.indexOf("?") + 1, url.length).split("&");

    // 나누어진 값의 비교를 통해 paramName 으로 요청된 데이터의 값만 return
    for (var i = 0; i < parameters.length; i++) {
      var varName = parameters[i].split("=")[0];
      if (varName.toUpperCase() == paramName.toUpperCase()) {
        //파라미터 중 page와 일치하는게 나오면
        returnValue = parameters[i].split("=")[1];
        return decodeURIComponent(returnValue);
      }
    }
    return undefined; //위 for문에서 page파라미터가 없을때는 이 코드가 실행.
  },
  toggleFullScreen: function () {
    if (
      !document.fullscreenElement && // alternative standard method
      !document.mozFullScreenElement &&
      !document.webkitFullscreenElement &&
      !document.msFullscreenElement
    ) {
      // current working methods
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen(
          Element.ALLOW_KEYBOARD_INPUT
        );
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  },
  openFullscreen: function () {
    /* Get the documentElement (<html>) to display the page in fullscreen */
    var elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      /* Safari */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      /* IE11 */
      elem.msRequestFullscreen();
    }
  },
  closeFullscreen: function () {
    var elem = document.documentElement;
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      /* Safari */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      /* IE11 */
      document.msExitFullscreen();
    }
  },
  setCookie: function (cookieName, value, exdays) {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var cookieValue =
      escape(value) +
      (exdays == null ? "" : "; expires=" + exdate.toGMTString());
    document.cookie = cookieName + "=" + cookieValue;
  },
  deleteCookie: function (cookieName) {
    var expireDate = new Date();
    expireDate.setDate(expireDate.getDate() - 1); //어제날짜를 쿠키 소멸날짜로 설정
    document.cookie =
      cookieName + "= " + "; expires=" + expireDate.toGMTString();
  },
  getCookie: function (cookieName) {
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
  },

  //firebase auth 관련
  signIn: function () {
    // Sign into Firebase using popup auth & Google as the identity provider.
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
  },
  signOut: function () {
    // Sign out of Firebase.
    firebase.auth().signOut();
  },
  isUserSignedIn: function () {
    return !!firebase.auth().currentUser;
    // !! 는 JS에서 undefined, "", 0 일때 false를 반환, 그외엔 전부 true를 반환한다.
  },

  //firebase Class & Conveter
  ContentDTO: class {
    constructor(
      title,
      explain,
      favoriteCount,
      favorites,
      imageArr,
      imageFileName,
      imageUrl,
      timestamp,
      uid,
      userId,
      videoUrl,
      youtubeId
    ) {
      this.title = title;
      this.explain = explain;
      this.favoriteCount = favoriteCount || 0;
      this.favorites = favorites || {}; //java의 map객체는, javascript에서는 객체 로 처리해야 함.
      this.imageArr = imageArr || [];
      this.imageFileName = imageFileName;
      this.imageUrl = imageUrl;
      this.timestamp = timestamp;
      this.uid = uid;
      this.userId = userId;
      this.videoUrl = videoUrl || "";
      this.youtubeId = youtubeId || "";
    }
    toString() {
      return this.explain + ", " + this.imageUrl + ", " + this.uid;
    }
  },
  contentDTOConverter: {
    toFirestore: function (contentDTO) {
      return {
        title: contentDTO.title,
        explain: contentDTO.explain,
        favoriteCount: contentDTO.favoriteCount,
        favorites: contentDTO.favorites,
        imageArr: contentDTO.imageArr,
        imageFileName: contentDTO.imageFileName,
        imageUrl: contentDTO.imageUrl,
        timestamp: contentDTO.timestamp,
        uid: contentDTO.uid,
        userId: contentDTO.userId,
        videoUrl: contentDTO.videoUrl,
        youtubeId: contentDTO.youtubeId,
      };
    },
    fromFirestore: function (snapshot, options) {
      const data = snapshot.data(options);
      return new my_custom_vars.ContentDTO(
        data.title,
        data.explain,
        data.favoriteCount,
        data.favorites,
        data.imageArr,
        data.imageFileName,
        data.imageUrl,
        data.timestamp,
        data.uid,
        data.userId,
        data.videoUrl,
        data.youtubeId
      );
      //주의, 여기서도 class를 요청하므로 이 my_custom_vars안에 있는 클래스를 지정해줘야 함.
    },
  },
  ProfileImageDTO: class {
    constructor(image, user_email) {
      this.image = image || "";
      this.user_email = user_email;
    }
  },
  profileImageConverter: {
    toFirestore: function (profileImage) {
      return {
        image: profileImage.image,
        user_email: profileImage.user_email,
      };
    },
    fromFirestore: function (snapshot, options) {
      const data = snapshot.data(options);
      return new my_custom_vars.ProfileImageDTO(data.image, data.user_email);
    },
  },
  InfoUser: class {
    constructor(
      name,
      relation,
      selfIntro,
      uid,
      wordWannaSay,
      isFirstLogin,
      isFirstWritingEventTriggered,
      isHalfClearEventTriggered,
      isAllClearEventTriggered,
      isOnlyOneFirstExplorerEventTriggered,
      isLongWriterEventTriggered,
      isMaxPhotoUploadEventTriggered
    ) {
      this.name = name;
      this.relation = relation;
      this.selfIntro = selfIntro;
      this.uid = uid;
      this.wordWannaSay = wordWannaSay;
      //기본값이 true. cardUI 들어오면 (true => 환영 모달 이벤트 발생) 따라서 알림 표시 후엔 false
      this.isFirstLogin = isFirstLogin; //기본값  true;

      //cardUI서 판단. 동작조건 ( images에 유저글이 1개 )
      //이벤트 : 어떤 유저든 자기의 첫 글을 남기면 배지 획득 모달 이벤트 발생. 발생 이후, 이 스위치 toggle
      this.isFirstWritingEventTriggered = isFirstWritingEventTriggered; //기본값 false;
      //card UI서 판단. 동작조건 ( images에 유저글이 특정 개수 n개 )
      //이벤트 : 어떤 유저든 특정개수 글이 되면 배지 획득 모달 이벤트 발생. 발생 이후, 이 스위치 toggle
      this.isHalfClearEventTriggered = isHalfClearEventTriggered; //기본값 false;
      //card UI서 판단. 동작조건 ( images에 유저글이 특정 개수 m개 )
      //이벤트 : 어떤 유저든 특정개수 글이 되면 배지 획득 모달 이벤트 발생. 발생 이후, 이 스위치 toggle
      this.isAllClearEventTriggered = isAllClearEventTriggered; //기본값 false;

      //서버에 첫 글을 남긴 학기당 1인으로 제한하는 배지. 어떤 유저든 자기 첫글 남기는 이벤트랑 겹치므로 순서는
      // 이 이벤트 발동이 후순( 모든 유저의 자기만의 첫글 이벤트 모달 ok클릭시 확인 할 것)
      this.isOnlyOneFirstExplorerEventTriggered =
        isOnlyOneFirstExplorerEventTriggered; //기본값 false;
      //특정 ( 가령 1000자 ) 자수 이상의 글을 쓴 사람에게 주는 배지.
      this.isLongWriterEventTriggered = isLongWriterEventTriggered; //기본값 false;
      this.isMaxPhotoUploadEventTriggered = isMaxPhotoUploadEventTriggered; //기본값 false;
    }
  },
  infoUserConverter: {
    toFirestore: function (user) {
      return {
        name: user.name,
        relation: user.relation,
        selfIntro: user.selfIntro,
        uid: user.uid,
        wordWannaSay: user.wordWannaSay,
        isFirstLogin: user.isFirstLogin, //초기값 true
        isFirstWritingEventTriggered: user.isFirstWritingEventTriggered, //이하 전부 초기값 false
        isHalfClearEventTriggered: user.isHalfClearEventTriggered,
        isAllClearEventTriggered: user.isAllClearEventTriggered,
        isOnlyOneFirstExplorerEventTriggered:
          user.isOnlyOneFirstExplorerEventTriggered,
        isLongWriterEventTriggered: user.isLongWriterEventTriggered,
        isMaxPhotoUploadEventTriggered: user.isMaxPhotoUploadEventTriggered,
      };
    },
    fromFirestore: function (snapshot, options) {
      const data = snapshot.data(options);
      return new my_custom_vars.InfoUser(
        data.name,
        data.relation,
        data.selfIntro,
        data.uid,
        data.wordWannaSay,
        data.isFirstLogin,
        data.isFirstWritingEventTriggered,
        data.isHalfClearEventTriggered,
        data.isAllClearEventTriggered,
        data.isOnlyOneFirstExplorerEventTriggered,
        data.isLongWriterEventTriggered,
        data.isMaxPhotoUploadEventTriggered
      );
    },
  },
  CommentDTO: class {
    constructor(comment, timestamp, uid, userId, name, comment_attached_docid) {
      this.comment = comment;
      this.timestamp = timestamp;
      this.uid = uid;
      this.userId = userId;
      this.name = name;
      this.comment_attached_docid = comment_attached_docid;
    }
  },
  commentConverter: {
    toFirestore: function (comment_obj) {
      return {
        comment: comment_obj.comment,
        timestamp: comment_obj.timestamp,
        uid: comment_obj.uid,
        userId: comment_obj.userId,
        name: comment_obj.name,
        comment_attached_docid: comment_obj.comment_attached_docid,
      };
    },
    fromFirestore: function (snapshot, options) {
      const data = snapshot.data(options);
      return new my_custom_vars.CommentDTO(
        data.comment,
        data.timestamp,
        data.uid,
        data.userId,
        data.name,
        data.comment_attached_docid
      );
    },
  },
  NoticeDTO: class {
    constructor(
      title,
      uid,
      timestamp,
      fileDownloadLinkArray,
      fileNameArray,
      content
    ) {
      this.title = title;
      this.uid = uid;
      this.timestamp = timestamp;
      this.fileDownloadLinkArray = fileDownloadLinkArray || [];
      this.fileNameArray = fileNameArray || [];
      this.content = content;
    }
  },
  noticeConverter: {
    toFirestore: function (notice_obj) {
      return {
        title: notice_obj.title,
        uid: notice_obj.uid,
        timestamp: notice_obj.timestamp,
        fileDownloadLinkArray: notice_obj.fileDownloadLinkArray,
        fileNameArray: notice_obj.fileNameArray,
        content: notice_obj.content,
      };
    },
    fromFirestore: function (snapshot, options) {
      const data = snapshot.data(options);
      return new my_custom_vars.NoticeDTO(
        data.title,
        data.uid,
        data.timestamp,
        data.fileDownloadLinkArray,
        data.fileNameArray,
        data.content
      );
    },
  },
};
