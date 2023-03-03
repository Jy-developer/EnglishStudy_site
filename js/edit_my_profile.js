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
function sayHelloToUser() {    
    const userName = usersInfoMap.get(firebase.auth().currentUser.uid).name;
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

//비어있거나 공백인 문자열인 경우 -> true 반환
function isBlankOrEmptyString(str) {        
    return !str || !(str.toString().trim());
}

function addFunctionToBtnEditSelfIntro() {
    $('#btn_edit_selfintro').on('click', function() {
        $('#btn_edit_selfintro').hide();        //수정 버튼 숨김
        var text = $('#p_my_selfintro').text();
        $('#p_my_selfintro').hide();            //기존 소개 표시하던 p 숨김
        $('#textarea_edit_selfintro').val(text);
        $('#textarea_edit_selfintro').show();         //새 입력창 표시
        $('#btn_save_selfintro').show();              //입력 후 저장 버튼 표시
        $('#btn_save_selfintro_cancel').show();            //취소 버튼도 표시        

        addFunctionToBtnSaveSelfIntro();        //저장 버튼에 function 부착
        addFunctionToBtnSaveCancelSelfIntro();  //취소 버튼에 function 부착
    });    
}

function addFunctionToBtnSaveSelfIntro() {
    $('#btn_save_selfintro').on('click', function() {
        var new_intro = $('#textarea_edit_selfintro').val();
        db.collection('usersInfo').doc(firebase.auth().currentUser.uid).set({'selfIntro' : new_intro},{merge : true}).then(()=>{            
            $('#textarea_edit_selfintro').hide();
            $('#textarea_edit_selfintro').val('');
            $('#btn_save_selfintro').hide();
            $('#btn_save_selfintro_cancel').hide();

            $('#p_my_selfintro').text( filterXSS(new_intro) );
            $('#p_my_selfintro').show();            //다시 프로필 소개 p 표시
            $('#btn_edit_selfintro').show();        //다시 수정 버튼 표시
        }).catch(
            error => {my_custom_vars.showSwalErrorMessage_db(error);}
        );
    });
}

function addFunctionToBtnSaveCancelSelfIntro() {
    $('#btn_save_selfintro_cancel').on('click', function() {
        $('#textarea_edit_selfintro').hide();
        $('#textarea_edit_selfintro').val('');
        $('#btn_save_selfintro').hide();
        $('#btn_save_selfintro_cancel').hide();

        $('#p_my_selfintro').show();            //다시 프로필 소개 p 표시
        $('#btn_edit_selfintro').show();        //다시 수정 버튼 표시
    });
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
    var uid = firebase.auth().currentUser.uid;
    $('#h3_user_name').text(filterXSS(usersInfoMap.get(uid).name));             //유저 이름    
    $('#span_my_relation').text( filterXSS(usersInfoMap.get(uid).relation) );   //반 이름
    $('#p_my_selfintro').text(filterXSS(usersInfoMap.get(uid).selfIntro));      //자기 소개
    addFunctionToBtnEditSelfIntro();            //자기소개 수정 버튼 function 부착

    if (profileImageMap.get(uid)) {     //이미지 있을 때        
        $("#img_profile").attr('src', profileImageMap.get(uid).image);
        $("#img_profile").css('object-fit', 'cover');
    }else{                  //없어서 undefined 리턴 시                
        $("#img_profile").attr('src', '/img/user_without_profile.png');
        $("#img_profile").css('object-fit', 'contain');
    }
    $('#div_upper_profile_img').click(function() {      //프로필 이미지 누르면 input 클릭 트리거
        $('#input_profile_img').trigger('click');
    });

    $('#a_mailto').attr('href', `mailto:${firebase.auth().currentUser.email}`);    // 메일 버튼
    
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
                        <span class="lead mb-0">You have a <span class="h4"> ${my_custom_vars.badgeTitles[cleared_condition[i]]} </span> badge</span>                        
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
    db.collection("usersInfo").doc(firebase.auth().currentUser.uid).withConverter(my_custom_vars.infoUserConverter)
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

    //프로필 파일 인풋에 변화가 생기면
    $('body').on('change', '#input_profile_img', function(){        
        var file = this.files[0];                
        var readImg = new FileReader();  
        if (file.type.match('image.*')) {                        
            readImg.onload = (function(file) {
                return function(e) {
                    $('#img_profile').attr('file', file.name);
                    $("#img_profile").css('object-fit', 'cover');
                    $('#img_profile').attr('src', e.target.result);
                };
            })(file);
            readImg.readAsDataURL(file);

            showLoading();

            var filename = firebase.auth().currentUser.uid;
            //프로필 이미지 경로. 개인별 uid 폴더 안에 파일명도 uid와 동일(확장자 없음)
            var imageRef = storage.ref('userProfileImages/'+firebase.auth().currentUser.uid+'/'+filename);
            var uploadTask = imageRef.put(file);
            uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, function(snapshot){
                /* 업로드 진행중 리스너 */
                // var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                // console.log('Upload is ' + progress + '% done');
                // switch (snapshot.state) {
                // case firebase.storage.TaskState.PAUSED: // or 'paused'
                //     console.log('Upload is paused');
                //     break;
                // case firebase.storage.TaskState.RUNNING: // or 'running'
                //     console.log('Upload is running');
                //     break;
                // }
            }, function(error){
                hideLoading();
                my_custom_vars.showSwalErrorMessage_storage(error);
            },function(){
                //프로필 이미지 업로드 성공시
                uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL){                    
                    var data = new my_custom_vars.ProfileImageDTO();
                    data.image = downloadURL;
                    data.user_email = firebase.auth().currentUser.email;
                    db.collection('profileImages').doc(firebase.auth().currentUser.uid)
                        .withConverter(my_custom_vars.profileImageConverter).set(data).then(()=>{                            
                            //db 업데이트 까지 성공
                            hideLoading();
                            $('#btn_save_profile_img_Storage').hide();
                        }).catch(error2 => { 
                            hideLoading();
                            my_custom_vars.showSwalErrorMessage_db(error2);
                        });
                });
            });
        }else{
            swal('', 'Please select an image file', 'error');
        }        
    });
});