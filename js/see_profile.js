function showLoading() {
    $('#loading').show();
    $('#loading-image').show();
}
function hideLoading() {
    $('#loading').hide();
    $('#loading-image').hide();
}

$(window).on('load', function(){    
    hideLoading();    
});

//시간대별 인사 문구 교체. 실행 시기는 firebase Auth 감시자 작동시
function sayHelloToUser() {    //see_profile에서의 sayHelloToUser() 펑션만 많이 다름.
    //여기 문서만 usersInfoMap에 지금 프로필 유저의 1인정보만 받아오므로, 현재 접속유저 정보를 다시 db에서 받아옴
    db.collection("usersInfo").doc(firebase.auth().currentUser.uid).withConverter(my_custom_vars.infoUserConverter)
        .get().then( doc => {            
            if(doc.exists){
                var userName = doc.data().name;
                $('#nameToHello').text(userName+'.');    
                const today = new Date();
                const hours = today.getHours();    
                if(hours >=6 && hours <12){
                    $('#time_changing_msg').prepend('Good Morning, ');
                }else if(hours >=12 && hours <17){
                    $('#time_changing_msg').prepend('Good Afternoon, ');
                }else if(hours >=17 && hours <21){
                    $('#time_changing_msg').prepend('Good Evening, ');
                }else if((hours >=21 && hours < 24) || (hours >=0) ){
                    $('#time_changing_msg').prepend('Good Evening, ');        
                }                
            }
        }
    ).catch(error => {
        my_custom_vars.showSwalErrorMessage_db(error);        
    });    
}

//비어있거나 공백인 문자열인 경우 -> true 반환
function isBlankOrEmptyString(str) {        
    return !str || !(str.toString().trim());
}

// Initiate firebase auth.
function initFirebaseAuth() {
    // Listen to auth state changes.
    firebase.auth().onAuthStateChanged(authStateObserver);    
}

// Triggers when the auth state change for instance when the user signs-in or signs-out.
function authStateObserver(user) {
    if (user) { // User is signed in!           
        initFirestoreDBOperation();
    } else { // User is signed out!
          
    }
}

//db에서 유저 정보 및 사진 가져와서 뿌려줌
function showUserProfile() {
    var uid = my_custom_vars.getParameters('index');
    $('#h3_user_name').text(filterXSS(usersInfoMap.get(uid).name));             //유저 이름    
    $('#span_my_relation').text( filterXSS(usersInfoMap.get(uid).relation) );   //반 이름
    $('#p_my_selfintro').text(filterXSS(usersInfoMap.get(uid).selfIntro));      //자기 소개

    if (profileImageMap.get(uid)) {     //이미지 있을 때        
        $("#img_profile").attr('src', profileImageMap.get(uid).image);
        $("#img_profile").css('object-fit', 'cover');
    }else{                  //없어서 undefined 리턴 시                
        $("#img_profile").attr('src', '/img/user_without_profile.png');
        $("#img_profile").css('object-fit', 'contain');
    }
    $('#a_mailto').attr('href', `mailto:${my_custom_vars.getParameters('mail')}`);    // 메일 버튼
    
    //배지 표시 부분. 1.첫 글  2.중간완료  3.글전부완료  4.서버 첫글(only)  5.긴글 작성   6.사진10장max    
    var conditions = [usersInfoMap.get(uid).isFirstWritingEventTriggered, usersInfoMap.get(uid).isHalfClearEventTriggered, 
                    usersInfoMap.get(uid).isAllClearEventTriggered, usersInfoMap.get(uid).isOnlyOneFirstExplorerEventTriggered, 
                    usersInfoMap.get(uid).isLongWriterEventTriggered, usersInfoMap.get(uid).isMaxPhotoUploadEventTriggered];
    var cleared_condition = [];     //true 인 조건의 인덱스만 들어 있음
    for (let i = 0; i < conditions.length; i++) {
        if(conditions[i] == true) cleared_condition.push(i);
    }
    for (let i = 0; i < cleared_condition.length; i++) {
        $('#div_badge_panel').append(`
        <!-- Button Modal -->
        <div class="col-4 mb-3">
            <button type="button" class="btn btn-block btn-primary mb-2 rounded-circle" style="width:5rem; height:5rem; display:inline-block;" data-toggle="modal" data-target="#modal-achievement${cleared_condition[i]}">                
                ${my_custom_vars.badgeIcons[cleared_condition[i]]}
            </button>
            <h2 class="h5 mb-0">${my_custom_vars.badgeTitles[cleared_condition[i]]}</h2>
        </div>        
        <!-- Modal Content -->
        <div class="modal fade" id="modal-achievement${cleared_condition[i]}" tabindex="-1" role="dialog" aria-labelledby="modal-achievement${cleared_condition[i]}" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content shadow-soft">
                    <div class="modal-header mx-auto mt-3">
                        <span class="lead mb-0">The <span class="h4"> ${my_custom_vars.badgeTitles[cleared_condition[i]]} </span> badge</span>                        
                    </div>
                    <div class="modal-body">
                        <div class="py-3 text-center">
                            <span class="modal-icon icon icon-dark display-1-lg">${my_custom_vars.badgeIcons[cleared_condition[i]]}</span>
                            <h2 class="h4 modal-title my-2">The ${my_custom_vars.badgeTitles[cleared_condition[i]]}</h2>
                            <p>${my_custom_vars.badgeComments[cleared_condition[i]]}</p>
                            <div class="progress-wrapper">
                                <div class="progress">
                                    <div class="progress-bar bg-dark" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%;animation: 2s ease 0s 1 normal none running animate-positive;opacity: 1;"></div>
                                </div>
                            </div>
                        </div>
                    </div>                
                </div>
            </div>
        </div>                
        `);          
    }
}

var db = firebase.firestore();
var storage = firebase.storage();

var profileImageMap = new Map();    //각 문서 key는 문서명(유저 uid), 값은 커스텀 객체(docId 프로퍼티가 추가된)
var usersInfoMap = new Map();       // 문서 key는 문서명(유저 uid), 값은 커스텀 객체(docId 프로퍼티가 추가된). 단 현 프로필 유저 1인만 있음
// 유저 uid 1인 자료만 setting
function initFirestoreDBOperation() {           
    db.collection("usersInfo").doc(my_custom_vars.getParameters('index')).withConverter(my_custom_vars.infoUserConverter)
        .get().then( doc => {            
            if(doc.exists){
                var userInfo_obj = doc.data();
                userInfo_obj.docId = doc.id;
                usersInfoMap.set(doc.id, userInfo_obj);
                sayHelloToUser();
                //profileImage는 전체 문서 받아와서 현 유저uid로 get() 하는 식
                db.collection('profileImages').withConverter(my_custom_vars.profileImageConverter).get().then(
                    (querySnapshot) => {
                        querySnapshot.forEach( (doc2) => {
                            var profileImageDTO = doc2.data();
                            profileImageDTO.docId = doc2.id;
                            profileImageMap.set(doc2.id, profileImageDTO);
                        });
                        showUserProfile();          //화면에 뿌리기
                        my_custom_vars.changeIconIfExistRecentNotice();        //신규 공지사항 확인 후 icon 교체
                    }
                ).catch( error2 => {
                    my_custom_vars.showSwalErrorMessage_db(error2);
                });                
            }
        }
    ).catch(error => {
        my_custom_vars.showSwalErrorMessage_db(error);        
    });    
}

// initialize Firebase
initFirebaseAuth();

$(document).ready ( function () {
    //탈퇴 버튼
    $('#a_quit_account_btn').click(my_custom_vars.userDeleteAccount);       //함수뒤에 ()붙이지 말것. 바로 실행됨
    //로그아웃 버튼
    $('#logout_btn').click(my_custom_vars.userLogout);    
    //관리자 메일 버튼
    $("body").on('click', '#btn_contact_administrator', my_custom_vars.sendMailToAdmin);
});