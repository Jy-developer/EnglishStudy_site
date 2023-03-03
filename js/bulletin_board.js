function showLoading() {
    $('#loading').show();
    $('#loading-image').show();
}
function hideLoading() {
    $('#loading').hide();
    $('#loading-image').hide();
}

$(window).on('load', function(){    
    // hideLoading();    
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

function printDateFromSystemMilliseconds(milliSeconds) {
    return moment(milliSeconds).format('YYYY.M.D.');
}

function showNewBadgeToNewNotice(timestamp) {
    var now = Number(new Date().getTime());
    var written_time = Number(timestamp);
    if (now - written_time < my_custom_vars.newNoticeStandardMilliSecond) {       // 쓴지 3일 미만일 때. 하루가 86,400,000 밀리초
        return '<span class="badge badge-secondary text-uppercase" style="vertical-align:top; margin-left:0.4rem;">New</span>';        
    }else{
        return '';
    }
}
//DB 자체를 조회하는 다른 페이지의 동일이름 메소드와 다름. 이미 notices DB 자료가 있어서 그걸 활용하기 때문에. 
function changeIconIfExistRecentNotice(newNoticeCount) {        
    switch (newNoticeCount) {
        case 0:
            //3일 내 공지사항이 없으므로 do nothing            
            break;
        case 1:
            $('a[data-original-title=Announcement]').empty();
            $('a[data-original-title=Announcement]').css('transform', 'translateY(-4px)');
            $('a[data-original-title=Announcement]').append(`
            <img src="/img/alarm_count_icon/notice_alarm_1.svg" style="opacity: 1; width: 2rem; height: 2rem;">
            `);            
            break;
        case 2:
            $('a[data-original-title=Announcement]').empty();
            $('a[data-original-title=Announcement]').css('transform', 'translateY(-4px)');
            $('a[data-original-title=Announcement]').append(`
            <img src="/img/alarm_count_icon/notice_alarm_2.svg" style="opacity: 1; width: 2rem; height: 2rem;">
            `);
            break;
        case 3:
            $('a[data-original-title=Announcement]').empty();
            $('a[data-original-title=Announcement]').css('transform', 'translateY(-4px)');
            $('a[data-original-title=Announcement]').append(`
            <img src="/img/alarm_count_icon/notice_alarm_3.svg" style="opacity: 1; width: 2rem; height: 2rem;">
            `);
            break;
        default:
            $('a[data-original-title=Announcement]').empty();
            $('a[data-original-title=Announcement]').css('transform', 'translateY(-4px)');
            $('a[data-original-title=Announcement]').append(`
            <img src="/img/alarm_count_icon/notice_alarm_morethan_3.svg" style="opacity: 1; width: 2rem; height: 2rem;">
            `);
            break;
    }
}

var isAuthFlag = false;     //Professor Check flag
function isAuthForWriting() {       //Professor Check
    db.collection('notices').doc('auth').collection(firebase.auth().currentUser.uid).get().then(
        doc => {        //Professor, then show write icon
            isAuthFlag = true;
            initFirestoreDBOperation();            
        }
    ).catch( error => {     //Not professor
        initFirestoreDBOperation();         //authFlag 변경없이 본격 DB세팅 시작
    });
}
function toggleVisuality(){
    var result = isAuthFlag? '' : 'visibility: hidden;';
    return result;
}

function whetherShowDelEditBtn(docId, noticeObj) {
    var str = `
    <div class="d-flex align-items-center ml-4 div_edit_del_notice_btn" style="${toggleVisuality()}">
        <div class="btn-group dropright">
            <button class="btn btn-link border-0 dropdown-toggle dropdown-toggle-split m-0 p-0" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <span class="icon icon-sm">
                    <span class="fas fa-ellipsis-h icon-secondary"></span>
                </span>
                <span class="sr-only">Toggle Dropdown</span>
            </button>
            <div class="dropdown-menu" x-placement="bottom-start" style="position: absolute; will-change: transform; top: 0px; left: 0px; transform: translate3d(0px, 31px, 0px);">
                <a class="dropdown-item a_edit_notice" index="${docId}"><span class="fas fa-edit mr-2"></span>
                    Edit post</a>
                <a class="dropdown-item text-danger a_delete_notice" index="${docId}"><span class="fa fa-trash mr-2" aria-hidden="true"></span>
                    Delete post</a>
            </div>
        </div>
    </div>
    `;
    return str;    
}

function returnAttachmentsIfExist(docId, noticeObj) {    
    if (noticeObj.fileDownloadLinkArray.length != 0) {
        var str = '';
        for (let i = 0; i < noticeObj.fileDownloadLinkArray.length; i++) {            
            str += `
            <a class="btn btn-primary px-2 py-1 mb-1 font-weight-bold d-block text-left a_down_attachement" download="${noticeObj.fileNameArray[i]}" href="${noticeObj.fileDownloadLinkArray[i]}" target="_blank">
                <i class="fas fa-cloud-download-alt mr-2"></i> ${noticeObj.fileNameArray[i]}
            </a>
            `;
        }
        return str;
    }else{
        return '';
    }    
}

// Initiate firebase auth.
function initFirebaseAuth() {
    // Listen to auth state changes.
    firebase.auth().onAuthStateChanged(authStateObserver);    
}

// Triggers when the auth state change for instance when the user signs-in or signs-out.
function authStateObserver(user) {
    if (user) { // User is signed in!       
        isAuthForWriting();            
    } else { // User is signed out!
          
    }
}

function show_notice_to_screen() {      //화면에 공지사항 목록 표시
    if (isAuthFlag){
        $('#a_write_notice_btn').show();        //글쓰기 버튼 표시
        $('#a_admin_summary_btn').show();     //admin 학생글수 요약 표시 버튼 표시
    } 

    
    if (noticesMap.size == 0) {     //글이 하나도 없을 때도 loading창은 없애줘야 함
        hideLoading();
        return;
    }

    //공지사항 목록 표시
    var count = 0;
    for(const [key, value] of noticesMap.entries()){
        var docId = key;
        var notice_obj = value;
        //여기 각 글에 대한 수정, 삭제 버튼도 표시해야
        $('#div_accordion').append(`
        <div class="card card-sm card-body bg-primary border-light mb-0">
            <a href="#row-${count}" data-target="#row-${count}" class="accordion-panel-header collapsed" data-toggle="collapse" role="button" aria-expanded="false">
                <table style="width: 100%;">                                  
                    <tbody>
                        <tr class="my_tr">
                            <td class="mb-0 font-weight-bold my_table_title_cell">${notice_obj.title}${showNewBadgeToNewNotice(notice_obj.timestamp)}</td>
                            <td class="my_table_writer_date_cell">Administrator</td>
                            <td class="my_table_writer_date_cell">${printDateFromSystemMilliseconds(notice_obj.timestamp)}</td>
                        </tr>
                    </tbody>                                        
                </table>                                    
            </a>
            <!-- 클릭시 보이는 내용 -->
            <div class="collapse" id="row-${count}">
                <div class="pt-3">
                    <!-- 첨부 파일 있을 때 필요한 부분 -->
                    <div class="mb-4 div_attached_file">
                        <div class="d-flex justify-content-between">
                            <!-- 공지사항 수정 및 삭제 버튼 -->
                            ${whetherShowDelEditBtn(docId, notice_obj)}                            
                            <!-- 첨부파일 있을때 Programmatically 반복해서 추가할 부분 -->                            
                            <div class="w-50">
                                ${returnAttachmentsIfExist(docId, notice_obj)}
                            </div>
                        </div><!-- d-flex 여기까지 -->
                    </div>
                    <p class="mb-3 p_notice_content">${notice_obj.content}</p>
                </div>
            </div>
        </div>    
        `);
        count++;
        if (count == noticesMap.size ) {
            hideLoading();
        }
    }    

    $('.a_edit_notice').on('click', function() {        // 각 공지사항 수정 버튼 리스너 설정
        window.location.href = `/notice_edit.html?index=${$(this).attr('index')}`;
    });
    $('.a_delete_notice').on('click', function() {      //각 공지사항 삭제 버튼 리스너 설정
        swal({
            title: "Are you sure to delete your notice?",
            text: "This action can not be un-​done.",
            icon: "warning",
            buttons: true,
            dangerMode: true,
          })
          .then((willDelete) => {
            if (willDelete) {
                showLoading();
                var noticeDTO = noticesMap.get($(this).attr('index'));      
                if(noticeDTO.fileNameArray.length == 0){    //첨부파일이 없는 경우
                    db.collection('notices').doc(noticeDTO.docId).delete().then(()=>{
                        hideLoading();
                        window.location.href = "/bulletin_board.html";      // 결과적으로 현 페이지로 다시 새로고침 효과
                    }).catch((error)=>{
                        hideLoading();
                        my_custom_vars.showSwalErrorMessage_db(error);
                    });
                }else{          //첨부파일 있을 때. 파일 삭제 이후 db 정리                    
                    // Storage의 파일 연속 삭제 코드
                    let delete_comeplete_count = 0;
                    for (let i = 0; i < noticeDTO.fileNameArray.length; i++) {                    
                        storage.ref('notices/'+firebase.auth().currentUser.uid+'/'+noticeDTO.fileNameArray[i]).delete().then(
                            function() {
                                delete_comeplete_count++;                            
                                if (delete_comeplete_count == noticeDTO.fileNameArray.length) {     //파일 전부 삭제 완료시
                                    db.collection('notices').doc(noticeDTO.docId).delete().then(()=>{
                                        hideLoading();
                                        window.location.href = "/bulletin_board.html";      // 결과적으로 현 페이지로 다시 새로고침 효과
                                    }).catch((error)=>{
                                        hideLoading();
                                        my_custom_vars.showSwalErrorMessage_db(error);
                                    });                                
                                }
                            }
                        ).catch(
                            function(error){
                                hideLoading();
                                my_custom_vars.showSwalErrorMessage_storage(error);                            
                            }
                        );
                    }
                }                
            } else {
              swal("Your job has been cancelled.");
            }
          });            
    });
}

var db = firebase.firestore();
var storage = firebase.storage();

var usersInfoMap = new Map();       // 문서 key는 문서명(유저 uid), 값은 커스텀 객체(docId 프로퍼티가 추가된).
var noticesMap = new Map();
// user 콜렉션과 notices 콜렉션을 가져오기
function initFirestoreDBOperation() {
    db.collection("usersInfo").withConverter(my_custom_vars.infoUserConverter).get().then(
        (querySnapshot) =>{
            querySnapshot.forEach((doc)=>{
                var userInfoDTO = doc.data();
                userInfoDTO.docId = doc.id;
                usersInfoMap.set(doc.id, userInfoDTO);
            });
            db.collection("notices").orderBy('timestamp', 'desc').withConverter(my_custom_vars.noticeConverter).get().then(
                (querySnapshot2) =>{
                    var recentNoticeInThreeDaysCount = 0;
                    querySnapshot2.forEach((doc2)=>{
                        var noticeDTO = doc2.data();
                        noticeDTO.docId = doc2.id;
                        if ((new Date().getTime())-Number(noticeDTO.timestamp) < my_custom_vars.newNoticeStandardMilliSecond) {
                            recentNoticeInThreeDaysCount++;
                        }
                        noticesMap.set(doc2.id, noticeDTO);
                    });
                    // 권한확인 및 DB 세팅 끝났으면
                    show_notice_to_screen();
                    //아래 메소드는 common_element로 바꾸면 안됨. 이 페이지의 독특성이 있으므로.
                    changeIconIfExistRecentNotice(recentNoticeInThreeDaysCount);    
                }
            ).catch( error2 =>{
                hideLoading();
                my_custom_vars.showSwalErrorMessage_db(error2);
            });
            sayHelloToUser();       //조금 빨리 표시하기 위해서, db 세팅 중간에 실행되도록 여기에 둠            
        }        
    ).catch(error => {
        hideLoading();
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
    //공지사항 글쓰기 버튼
    $('#a_write_notice_btn').click(function() {
        window.location.href = '/notice_write.html';
    });
    //admin 학생별 글 수 요약 보기 버튼
    $('#a_admin_summary_btn').click(function() {
        window.location.href = '/article_summary_view.html';
    });
});