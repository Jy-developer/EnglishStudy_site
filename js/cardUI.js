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
    //관리자에게 메일 버튼    
});

$(window).bind('beforeunload', function() {
    unsubscribe();
});

function printDateFromSystemMilliseconds(milliSeconds) {
    return moment(milliSeconds).format('YYYY.M.D.');
}

function ellipse_content_with_limit(content, char_limit) {        
    return content.length <= char_limit ? content : content.substring(0, char_limit-1)+"...";    
}

function findProfileImageOrDefaultImage(id) {
    return profileImageMap.get(id) ? profileImageMap.get(id).image : '/img/user_without_profile.png';    
}

function getProfileImgOrDefaultValue(obj) {
    var result = obj ? obj.image : '/img/user_without_profile.png';
    return result;
}

function getSelfIntroOrDefaultValue(obj) {    
    var result = obj.selfIntro ? obj.selfIntro : "You haven't introduced yourself yet";
    return result;
}

function setOptionCoverOrContainByExistenceProfileImg(obj) {
    var result = obj ? 'cover' : 'contain';
    return result;
}

function returnTitleOrDateAsTitle(contentDTO) {
    return contentDTO.title ? contentDTO.title : printDateFromSystemMilliseconds(contentDTO.timestamp);    
}

function showNewBadgeToNewArticle(timestamp) {
    if (moment(timestamp).format('YYYY.M.D.') == moment().format('YYYY.M.D.')) {
        return '<span class="badge badge-secondary text-uppercase" style="vertical-align:top; margin-left:0.4rem;">New</span>';
    }else{
        return '';
    }        
}

function returnDifferentIconIfClickedFavorite(favoriteMap) {
    if (!(firebase.auth().currentUser.uid in favoriteMap)) {
        return '<span class="far fa-thumbs-up mr-2 animate-up-2"></span>';
    }else{      //이미 내 uid가 들어있음. 좋아요 눌러져 있음            
        return '<span class="fas fa-thumbs-up mr-2"></span>';        
    }    
}

function returnCarouselIndicator(arraysLength, carousel_index) {
    var strToReturn = `<li data-target="#pic_Carousel_${carousel_index}" data-slide-to="0" class="active" style="height:7px; width:7px;"></li>`;
    for (let i = 1; i < arraysLength; i++) {
        strToReturn += `<li data-target="#pic_Carousel_${carousel_index}" data-slide-to="${i}" style="height:7px; width:7px;"></li>`;
    }
    return strToReturn;
}
function returnSoftShadowOrChoiceOfWeekClassName(doc_id){    
    if (rotaryWonImagesMap.has(doc_id)) {      //이 Map객체 안에 해당 key가 존재하는지
        return 'choice_of_week';
    }else{
        return 'shadow-soft';
    }
}

function returnGoldenBadgeImgIfLotteryWonArticle(doc_id) {
    if (rotaryWonImagesMap.has(doc_id)) {      //이 Map객체 안에 해당 key가 존재하는지
        return `<img src="/img/badge/golden_badge_lottery_won.png" style="position: absolute; top: 1rem; right: 1rem; width: 4.5rem; height: 4.5rem; z-index: 999;" class="g_ticket_badge" alt="${my_custom_vars.rotaryRelatedString[6]}" data-toggle="tooltip" data-placement="top" data-original-title="${my_custom_vars.rotaryRelatedString[6]}">`;
    }else{
        return '';
    }
}

function returnCarouselImages(imageArr, u_id, doc_id) {
    var strToReturn = `<div class="carousel-item active" style="height:274px;">
        <img class="d-block posting_img a_read_detail_article" src="${imageArr[0]}" onload="this.style.opacity = 1;" u-id="${u_id}" i-id="${doc_id}">
        </div>`;

    for (let i = 1; i < imageArr.length; i++) {
        strToReturn += `<div class="carousel-item" style="height:274px;">
        <img class="d-block posting_img a_read_detail_article" src="${imageArr[i]}" onload="this.style.opacity = 1;" u-id="${u_id}" i-id="${doc_id}">
        </div>`;        
    }
    return strToReturn;
}

function whenFirstUserComeInMakeScreen() {         //아직 해당 클래스에 누구도 일기 쓴 적이 없을 때 이 펑션을 띄움
    $('#card_container').empty();
    $('#card_container').append(`
    <div class="card bg-primary shadow-soft border-light px-4 py-5 text-center mb-5 mt-10 flex-row">
        <div class="col">
            <div class="card-header pb-0 mt-3">
                <h2 class="h1 mb-3">You can be the first explorer</h2>
            </div>
            <div class="card-body pt-2 px-0 ">
                <p class="mb-5 lead px-6">Be the first user to post on the site!! You can get <span style="font-weight:700;">achievement badge</span> that only you can have.
                </p>

                <div class="icon-box text-center mb-5 mb-md-0">
                    <div class="icon icon-shape icon-lg bg-soft shadow-soft border border-light rounded-circle mb-3">
                        <i class="bi bi-gem" style="font-size:3rem"></i>
                    </div>
                    <h2 class="h5 my-3" style="font-weight:700;">First Explorer</h2>
                    <p class="px-lg-4">Write the first historical posting</p>
                </div>
            </div>
        </div>

        <div class="col-4">
            <img src="/img/first_explorer.png" alt="illustration">
        </div>
    </div>
    `);    
}

function isFirstLoginShowModal() {          //각자 기준으로 자신의 처음 웹사이트 로그인 시 모달 표시 펑션
    if (usersInfoMap.get(firebase.auth().currentUser.uid).isFirstLogin) {        
        $('#modal-subscribe').modal('show');        //모달 버튼 안눌러도, 모달 띄우는 jquery 명령어
                
        $('#btn_firstlogin_user_modal_close').click(function() {
            $('#modal-subscribe').modal('hide');
            db.collection('usersInfo').doc(firebase.auth().currentUser.uid)
                .set({isFirstLogin:false}, {merge:true}).then(()=>{                    
                usersInfoMap.get(firebase.auth().currentUser.uid).isFirstLogin = false;     //수동 갱신                
            });
        });
    }

    //esc 눌러서 껐든, modal('hide')눌러서 껐든, 모든 이벤트를 인지가능한 코드
    // $('#modal-subscribe').on('hidden.bs.modal', function (e) {
    // });
}

function decorateMyProfileCard() {
    $('#img_profile_card_img').attr('src', getProfileImgOrDefaultValue(profileImageMap.get(firebase.auth().currentUser.uid)) ); //화면왼쪽 프로필카드이 현재 유저 얼굴
    $('#img_profile_card_img').css('object-fit', setOptionCoverOrContainByExistenceProfileImg(profileImageMap.get(firebase.auth().currentUser.uid)));       //이미지 있으면 cover꽉차게, 없으면 contain으로
    $('#img_profile_card_img').parent().parent().on('click', function() {
        window.location.href = `/edit_my_profile.html`;
    });
    //프로필 카드 내 이름
    $('#h3_profile_card_name').text(filterXSS(usersInfoMap.get(firebase.auth().currentUser.uid).name));      
    //프로필 카드 자기 소개
    $('#p_profile_selfIntro').text(filterXSS(getSelfIntroOrDefaultValue(usersInfoMap.get(firebase.auth().currentUser.uid))));
    //프로필 사진 젤 아래 메일송신 클릭 가능한 아이콘(프로바이더는 타유저 것은 알수없음)
    $('#a_provider_show_email_btn').attr('href', 'mailto:'+firebase.auth().currentUser.email);
    $('#a_provider_show_email_btn').append(`<span class="fas fa-envelope"></span>`);    
    //프로필 카드 배지 표시
    var writer_user_obj = usersInfoMap.get(firebase.auth().currentUser.uid);
    var conditions = [writer_user_obj.isFirstWritingEventTriggered, writer_user_obj.isHalfClearEventTriggered, 
                    writer_user_obj.isAllClearEventTriggered, writer_user_obj.isOnlyOneFirstExplorerEventTriggered, 
                    writer_user_obj.isLongWriterEventTriggered, writer_user_obj.isMaxPhotoUploadEventTriggered];
    var cleared_condition = [];     //true 인 조건의 인덱스만 들어 있음 ( 0, 2, 3, ..등으로 )
    for (let i = 0; i < conditions.length; i++) {
        if(conditions[i] == true) cleared_condition.push(i);
    }
    for (let i = 0; i < cleared_condition.length; i++) {
        $('#ul_profile_badge').append(`
        <li>
            <a aria-label="" class="icon icon-xs mr-1" data-bs-toggle="tooltip" data-placement="bottom" title="${my_custom_vars.badgeTitles[cleared_condition[i]]}" data-original-title="${my_custom_vars.badgeTitles[cleared_condition[i]]}">${my_custom_vars.badgeIconsSmall[cleared_condition[i]]}</a>
        </li>
        `);        
    }    
}

function group_pages_each_five_elem(last_page_num) {
    var outer_page_arr = [];
    var group_count = Math.floor((last_page_num-1)/5)+1

    for (let i = 0; i < group_count; i++) {
        outer_page_arr.push([]);
    }
    for (let i = 0; i < last_page_num; i++) {
        outer_page_arr[Math.floor(i/5)].push(i+1);                
    }
    return outer_page_arr;
}
function returnCommentCountOrShowNothing(count) {
    if (count == 0) {
        return '';          //덧글 없으면 코멘트 아이콘 자체를 표시 안함
    }
    str = `<a class="text-dark mr-3" style="cursor:default;">
        <span class="far fa-comments mr-2"></span>${count}
    </a>`;
    return str;
}

function show_bottom_pagination() {
    var last_page_num = Math.floor((postingMap.size-1)/12)+1
    var current_page_num = Number((my_custom_vars.getParameters('page') || 1 ));       //page 파라미터 없을땐 기본값 1
    current_page_num = current_page_num > last_page_num ? last_page_num : current_page_num; // 페이지는 최대 마지막 페이지넘버까지 제한    

    var page_arr = group_pages_each_five_elem(last_page_num);
    $('#ul_my_page_navigation').empty();        //일단 tag 초기화 ( 화면 clear )

    //페이지 네비 제일 왼쪽 << 화살표 버튼
    //현재 보려는 6페이지 이상일 때, 또 실제 6페이지 이상 존재시에만 << 표시 필요
    if (current_page_num > 5 && page_arr.length >= 2) {        
        $('#ul_my_page_navigation').append(`
            <li class="page-item">
                <a class="page-link" aria-label="first link" href="list_cardUI.html?page=${current_page_num-5}"><span class="fas fa-angle-double-left"></span></a>
            </li>
        `);
    }

    //페이지 네비게이터 가운데 페이지 반복
    // 6,7,8,9,10 또는 1,2,3,4,5,  또는 11, 12  또는 1,2,3 등으로 끝나야 함
    var inner_page_arr = page_arr[Math.floor((current_page_num-1)/5)];
    inner_page_arr.forEach(function(page) {
        $('#ul_my_page_navigation').append(`
            <li class="page-item">
                <a class="page-link page-number" href="/list_cardUI.html?page=${page}">${page}</a>
            </li>
        `);
    });
    $('a.page-number').eq(inner_page_arr.indexOf(current_page_num)).parent().addClass('active');      //페이지 선택된 것으로 표시        

    //페이지 네비 제일 우측 >> 화살표 버튼
    //현재 페이지 넘버가 속한 배열의 그 다음 배열 원소가 있을 때 존재
    if ( page_arr[Math.floor((current_page_num-1)/5)+1] !== undefined ) {
        $('#ul_my_page_navigation').append(`
            <li class="page-item">
                <a class="page-link" aria-label="first link" href="list_cardUI.html?page=${page_arr[Math.floor((current_page_num-1)/5)+1][0]}"><span class="fas fa-angle-double-right"></span></a>
            </li>
        `);        
    }
}

function show_cards_in_this_page() {
    var last_page_num = Math.floor((postingMap.size-1)/12)+1
    var current_page_num = Number((my_custom_vars.getParameters('page') || 1 ));       //page 파라미터 없을땐 기본값 1
    current_page_num = current_page_num > last_page_num ? last_page_num : current_page_num; // 페이지는 최대 마지막 페이지넘버까지 제한    
    var page_arr = group_pages_each_five_elem(last_page_num);
    
    var start_index = (current_page_num-1)*12;

    //화면에 보이는 column 초기화
    for (let i = 0; i < 3; i++) {
        $('.card-col-'+i).empty();        
    }
    for (let i = start_index; i <= start_index+11; i++) {
        var imageHeight = 274;       //현재는 274px 정도로 사진 높이 잡음. 추후 수정 가능 
        if (postingMap.get(i) !== undefined) {
            appendEachColumnPosting(i % 3, postingMap.get(i), i);       //3으로 나눠서 0,1,2 각각 열에 추가함
        }else{
            break;
        }
    }       
    $('img[data-toggle="tooltip"]').tooltip({       //img태그의 tooltip을 정상작동하게 해주는 소중한 코드 !!
        container: 'body'
     });

    //좋아요 버튼 ( read_one_article과 달리 버튼이 1개가 아니고 다수일 때 )
    $('.btn_favor_count').click(function() {        //다른 버튼 리스너와 달리 여기 있어야 태그 생성 이후에 리스너를 붙일 수 있음.
        if ($(this).children('span').hasClass('animate-up-2') === false ) {      //이미 좋아요 눌러서, 해당 클래스가 없다면
            return;  //do nothing
        }
        //따라서 이하 코드는, 무조건 좋아요가 추가가 되는 코드여야 한다.
        var imageRef = db.collection('images').doc($(this).attr('db_id'));
        return db.runTransaction((transaction) => {
            return transaction.get(imageRef).then((imgDoc)=>{
                if (!imgDoc.exists) {
                    swal('Error', 'Diary does not exist or a server error has occurred.', 'error');
                    return;
                }
                var contentDTO = imgDoc.data();
                
                if (!(firebase.auth().currentUser.uid in contentDTO.favorites)) {
                    contentDTO.favoriteCount = contentDTO.favoriteCount + 1;
                    contentDTO.favorites[firebase.auth().currentUser.uid] = true;
                    transaction.update(imageRef, contentDTO);
                }else{
                    //위에서 좋아요 이미 누른사람 걸러서 여기 올 일이 없음
                }                                    
            });
        }).then(()=>{           //좋아요 버튼 숫자의 변경은, 문서 "modified" 이므로 리스너가 처리 하지 않음             
             var count = +($(this).text());     //숫자화
             $(this).empty();
             $(this).append(`
                <span class="fas fa-thumbs-up mr-2"></span>${count+1}
             `);
        }).catch((error) => { my_custom_vars.showSwalErrorMessage_db(error); });    
    });
    //글쓴이 프로필 가는 버튼 설정
    $('.a_profile_link').on('click', function() {        
        window.location.href = `/read_detail_one_article.html?u=${$(this).attr('u-id')}&index=${$(this).attr('i-id')}`;
    });
    //개별 글 읽기 버튼 설정
    $('.a_read_detail_article').on('click', function() {
        window.location.href = `/read_detail_one_article.html?u=${$(this).attr('u-id')}&index=${$(this).attr('i-id')}`;
    });

    //개별 사진 누르면 해당 글 읽기로 들어가게 버튼 설정
    $('.a_read_detail_article').on('click', function() {
        window.location.href = `/read_detail_one_article.html?u=${$(this).attr('u-id')}&index=${$(this).attr('i-id')}`;
    });
    //golden ticket badge 눌러도 글 읽기로 들어가게 버튼 클릭 리스너 설정
    $('.choice_of_week').find('.g_ticket_badge').on('click', function() {       
        let u = $(this).parent().find('.a_read_detail_article').attr('u-id');        
        let index = $(this).parent().find('.a_read_detail_article').attr('i-id');        
        window.location.href = `/read_detail_one_article.html?u=${u}&index=${index}`;
    });
}

function returnModalTagString(badgeIndex) {
    var modalTagString = `                    
    <div class="modal fade" data-backdrop="static" id="modal-achievement${badgeIndex}" tabindex="-1" role="dialog" aria-labelledby="modal-achievement${badgeIndex}" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content shadow-soft">
                <div class="modal-header mx-auto mt-3">
                    <span class="lead mb-0">You've earned a new badge</span>                        
                </div>
                <div class="modal-body">
                    <div class="py-3 text-center">
                        <span class="modal-icon icon icon-dark display-1-lg">${my_custom_vars.badgeIcons[badgeIndex]}</span>
                        <h2 class="h4 modal-title my-2">The ${my_custom_vars.badgeTitles[badgeIndex]}</h2>
                        <p>${my_custom_vars.badgeComments[badgeIndex]}</p>
                        <div class="progress-wrapper">
                            <div class="progress">
                                <div class="progress-bar bg-dark" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%;animation: 2s ease 0s 1 normal none running animate-positive;opacity: 1;"></div>
                            </div>
                        </div>
                    </div>
                </div>  
                <div class="modal-footer">
                    <button type="button" class="btn btn-sm btn-primary" id="modal-achievement${badgeIndex}_close_btn">OK</button>
                </div>              
            </div>
        </div>
    </div>
    `;
    return modalTagString;
}

function appendModalSetCloseListner(index) {
    $('#div_badge_modal_here').append(`${returnModalTagString(index)}`);        
        $(`#modal-achievement${index}`).modal({keyboard:false});        //esc로 탈출 금지 모달
        modalCheckObject.modalOpenedCount++;                            //현재 열린 모달 카운트
        sendDataBadgeObj[my_custom_vars.infoUserBadgeFieldName[index]] = true;      //조건 충족한 필드 경우 객체 프로퍼티 변경
        $(`#modal-achievement${index}_close_btn`).on('click', function() {$(`#modal-achievement${index}`).modal('hide');});
        $(`#modal-achievement${index}`).on('hide.bs.modal', function (e) {     //모달 ok 누르면
            modalCheckObject.modalOpenedCount--;
            if (modalCheckObject.modalOpenedCount == 0) {
                showLoading();
                db.collection('usersInfo').doc(firebase.auth().currentUser.uid).set(sendDataBadgeObj, {merge:true}).then(()=>{
                    hideLoading();
                    //이미 cardUI에 있으므로, do nothing
                }).catch(error2 => {
                    hideLoading();
                    my_custom_vars.showSwalErrorMessage_db(error2);
                });                
            }
        });
}

function isStartBadgeAccomplished() {
    if (usersInfoMap.get(firebase.auth().currentUser.uid).isFirstWritingEventTriggered) {
        return;
    }    
    if (modalCheckObject.myArticleCount == 1) {     //배지 획득 조건 검토
        appendModalSetCloseListner(0);          //첫 글쓰기 배지 인덱스는 0
    }
}
function isIntermediateBadgeAccomplished() {    
    if (usersInfoMap.get(firebase.auth().currentUser.uid).isHalfClearEventTriggered) {
        return;
    }
    if (modalCheckObject.myArticleCount >= (my_custom_vars.articleCountToUploadInOneSemester)/2 ) {
        appendModalSetCloseListner(1);          //Half 글쓰기 배지 인덱스는 1
    }
}
function isPerfectBadgeAccomplished() {    
    if (usersInfoMap.get(firebase.auth().currentUser.uid).isAllClearEventTriggered) {
        return;
    }
    if (modalCheckObject.myArticleCount == my_custom_vars.articleCountToUploadInOneSemester) {
        appendModalSetCloseListner(2);          //Perfect 글쓰기 배지 인덱스는 2
    }
}
function isFirstExplorerBadgeAccomplished() {    
    if (usersInfoMap.get(firebase.auth().currentUser.uid).isOnlyOneFirstExplorerEventTriggered) {
        return;
    }
    const getLastValueInMap = map => Array.from(map)[map.size-1][1];        //Map에서 마지막 객체의 값 가져오는 메소드 선언
    if (getLastValueInMap(postingMap).uid == firebase.auth().currentUser.uid) {
        appendModalSetCloseListner(3);          //First Explorer 글쓰기 배지 인덱스는 3
    }
}

function checkBadgeConditionShowModals() {
    for (const [key, value] of postingMap.entries()) {
        if (value.uid == firebase.auth().currentUser.uid) {
            modalCheckObject.myArticleCount++;
        }        
    }
    isFirstExplorerBadgeAccomplished();     //서버 유일 배지를 먼저 검토하고 띄우면, 이게 다음에 뜨는 모달 밑에 깔리니까, 순서를 여기에 둬야 함
    isStartBadgeAccomplished();
    isIntermediateBadgeAccomplished();
    isPerfectBadgeAccomplished();
    
}

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

  // Triggers when the auth state change for instance when the user signs-in or signs-out.
function authStateObserver(user) {
    if (user) { // User is signed in!        
        initFirestoreDBOperation();                        
    } else { // User is signed out!
        // console.log("유저가 로그인하지 않았습니다. 또는...로그아웃했습니다.");        
    }
}
  
// Initiate firebase auth.
function initFirebaseAuth() {
    // Listen to auth state changes.
    firebase.auth().onAuthStateChanged(authStateObserver);
} 

// initialize Firebase
initFirebaseAuth();

var unsubscribe;

var db = firebase.firestore();

var modalCheckObject = {
    modalOpenedCount : 0,       //혹 배지 조건 충족해서 모달 열리면 ++
    onlyOnceRun : true,          // 배지 조건 체크는 딱 한번만 실행하기 위한 변수
    myArticleCount : 0         // 현재 유저가 쓴 글 수
};
var sendDataBadgeObj = {};      //배지 획득해서 usersInfo 업데이트시 보내는 data

var isNeededRefresh = true;     //현재 페이지에서 다른 유저가 글썼거나 삭제햇을때 업데이트 해야하는지 플래그
var postingMap = new Map();         //다른 컬렉션의 map과 다르게, 키 : 0,1,2,3..삽입순서임. 값: 커스텀객체(docId를 문서명으로 가진)
var comment_count_obj = {};         //image콜렉션의 문서id를 key로, comment개수를 값으로 하는 쌍들을 프로퍼티로 가지는 객체
var rotaryWonImagesMap = new Map();       //Golden ticket 당첨된 글들 docId 모은 Map ( 키와 값 동일 -> docId )
function addListenerToImageDB() {    
    unsubscribe = db.collection("images").orderBy("timestamp", "desc").withConverter(my_custom_vars.contentDTOConverter).onSnapshot((querySnapshot) => {
        querySnapshot.docChanges().forEach((change)=>{
            if (change.type === 'added' || change.type === 'removed') { //새로 페이지가 추가 또는 삭제되었을 때. 수정시는 제외
                if (usersInfoMap.get(change.doc.get('uid')).relation == usersInfoMap.get(firebase.auth().currentUser.uid).relation) {
                    //추가되거나, 삭제된 문서 중에서도, 해당 글쓴이의 relation이 지금 현재유저의 relation 과 같을 때 전체 리프레시가 필요.
                    isNeededRefresh = true;
                }
            }
        });
        if(isNeededRefresh){
            postingMap.clear();         //posting Map 초기화
            var myClass = usersInfoMap.get(firebase.auth().currentUser.uid).relation;        
            var index = 0;
            querySnapshot.forEach((doc) => {
                if (usersInfoMap.get(doc.data().uid).relation == myClass) {     //자기 반의 일기만
                    var postingDTO = doc.data();
                    postingDTO.docId = doc.id;
                    postingMap.set(index++, postingDTO);            //코드 실행후, index에 1추가
                    //코멘트 개수를 문서별로 만들기 위한 준비작업
                    if (comment_count_obj[doc.id] === undefined) {
                        comment_count_obj[doc.id] = 0;     //코멘트 갯수 초기값 0 설정 및 프로퍼티 생성
                    }
                }
            });
            db.collectionGroup('comments').withConverter(my_custom_vars.commentConverter)
            .get().then( (querySnapshot2) => {
                querySnapshot2.forEach((doc2) =>{
                    var commentobj = doc2.data();
                    comment_count_obj[commentobj.comment_attached_docid]++;     //코멘트 개수를 +1
                });
                db.collection('goldenTicketImages').get().then((query)=>{
                    query.forEach((document)=>{
                        rotaryWonImagesMap.set(document.data().docid, document.data().docid);                        
                    });
                    // DB 세팅 끝났으면
                    if (postingMap.size == 0) {     //일기가 아직 하나도 없는 상태일 때
                        whenFirstUserComeInMakeScreen();
                        return;
                    }
                    show_bottom_pagination();
                    show_cards_in_this_page();
                    isNeededRefresh = false;     //필요한 리프레시 완료됐으니 false로 상태 변경.
                    
                    if (modalCheckObject.onlyOnceRun) {          //현재 유저의 배지조건 검토는 image 리스너와 상관없이 1번만 실행
                        checkBadgeConditionShowModals();
                        modalCheckObject.onlyOnceRun = false;
                    }
                });                
            });
        }
    });
}

var usersInfoMap = new Map();      //각 문서 key는 문서명(유저 uid), 값은 커스텀 객체(docId 프로퍼티가 추가된)
var profileImageMap = new Map();   //각 문서 key는 문서명(유저 uid), 값은 커스텀 객체(docId 프로퍼티가 추가된)
function initFirestoreDBOperation() {
    db.collection('usersInfo').withConverter(my_custom_vars.infoUserConverter).get().then(
        (querySnapshot) => {
            querySnapshot.forEach((doc) =>{     //usersInfo는 현재 유저가 있으므로 최소 1개 이상 존재함
                var userInfoDTO = doc.data();
                userInfoDTO.docId = doc.id;
                usersInfoMap.set(doc.id, userInfoDTO);
            });
            sayHelloToUser();
            db.collection('profileImages').withConverter(my_custom_vars.profileImageConverter).get().then(
                (querySnapshot2) => {           //이 중괄호 안 profile콜렉션 문서 없어도 작동함...                    
                    querySnapshot2.forEach((doc2) => {
                        var profileImageDTO = doc2.data();
                        profileImageDTO.docId = doc2.id;
                        profileImageMap.set(doc2.id, profileImageDTO);                        
                    });
                    isFirstLoginShowModal();        //유저 첫번째 로그인인지 확인. cardUI 들어올때마다 1번 실행
                    decorateMyProfileCard();        //왼쪽 사이드바 내 프로필 카드 표시

                    addListenerToImageDB();         //image Listener 추가
                    my_custom_vars.changeIconIfExistRecentNotice();        //신규 공지사항 확인 후 icon 교체
                }                
            ).catch(error => {
                my_custom_vars.showSwalErrorMessage_db(error);
            });
        }
    ).catch(error2 =>{
        my_custom_vars.showSwalErrorMessage_db(error2);
    });    
}

function appendEachColumnPosting(colNumber, ObjectFromPostingMap, carousel_index) {
    //최상위 div class 에서 col-12등이 이상작동해서 계속 1/3 크기로 나오는데, => 해결책 div 에서 col-12 등의 속성을 수정하면 된다. col-은 가장 작을때 크기, col-lg는 좀 화면이 커졌을때 크기. col뒤에 붙은 숫자가 커질수록 화면대비차지 비율이 커졌? 지 싶음.    
    $('.card-col-'+colNumber).append(`        
        <div class="mb-5">
            <div class="card bg-primary border-light ${returnSoftShadowOrChoiceOfWeekClassName(ObjectFromPostingMap.docId)} my_card">
                ${returnGoldenBadgeImgIfLotteryWonArticle(ObjectFromPostingMap.docId)}
                <!-- 카드 메인 사진 -->
                <div id="pic_Carousel_${carousel_index}" class="carousel slide border border-light rounded" data-ride="carousel" data-interval="0">
                    <ol class="carousel-indicators" style="bottom : 0px;">                        
                        ${returnCarouselIndicator(ObjectFromPostingMap.imageArr.length, carousel_index)}
                    </ol>
                    <div class="carousel-inner rounded">                        
                        ${returnCarouselImages(ObjectFromPostingMap.imageArr, ObjectFromPostingMap.uid, ObjectFromPostingMap.docId)}                                              
                    </div>
                    <a class="carousel-control-prev" href="#pic_Carousel_${carousel_index}" role="button" data-slide="prev">
                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span class="sr-only">Previous</span>
                    </a>
                    <a class="carousel-control-next" href="#pic_Carousel_${carousel_index}" role="button" data-slide="next">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="sr-only">Next</span>
                    </a>
                </div>

                <div class="card-body pt-4" style="display:flex; flex-direction:column;">
                    <div class="media d-flex align-items-center justify-content-between">
                        <div class="post-group">
                            <!-- 아래 data-original-title 및 placement등은 마우스 위로 갖다대면 나오는 문구 설정 -->
                            <a class="a_profile_link font-weight-bold" data-toggle="tooltip" u-id="${ObjectFromPostingMap.uid}" data-placement="bottom" i-id="${ObjectFromPostingMap.docId}" title data-original-title="read">
                                <!-- 글쓴이 프로필 사진 및 표시되는 이름-->
                                <img class="avatar-md mr-2 img-fluid rounded-circle" style="object-fit:cover;" src="${findProfileImageOrDefaultImage(ObjectFromPostingMap.uid)}" alt="profile_img"> ${filterXSS(usersInfoMap.get(ObjectFromPostingMap.uid).name)}
                            </a>
                        </div>
                        <div class="d-flex align-items-center">
                            <!-- 카렌다는 아이콘이고, 날짜는 span 사이에 쓰여짐 -->
                            <span class="small"><span class="far fa-calendar-alt mr-2"></span>${printDateFromSystemMilliseconds(ObjectFromPostingMap.timestamp)}</span>                            
                        </div>
                    </div> 
                    <!-- 아티클 타이틀 -->
                    <h3 class="h5 card-title mt-4 font-weight-bold" style="max-height: 26px; overflow: auto;">${filterXSS(returnTitleOrDateAsTitle(ObjectFromPostingMap))}${showNewBadgeToNewArticle(ObjectFromPostingMap.timestamp)}</h3>
                    <!-- 아티클 내용 -->
                    <p class="card-text p_my_card" style="max-height: 110px; overflow: auto;">${filterXSS(ellipse_content_with_limit(ObjectFromPostingMap.explain, 90))}</p>
                    <div class="card-footer p-0">
                        <div class="d-flex flex-wrap flex-lg-nowrap align-items-center justify-content-between">
                            <div class="post-details mb-3 mb-lg-0">
                                <!-- 좋아요 버튼 -->
                                <button class="btn btn-sm btn-primary animate-hover mr-2 btn_favor_count" db_id="${ObjectFromPostingMap.docId}">
                                    ${returnDifferentIconIfClickedFavorite(ObjectFromPostingMap.favorites)}
                                    ${ObjectFromPostingMap.favoriteCount}
                                </button>                                
                            </div>
                            <div class="post-meta">
                                ${returnCommentCountOrShowNothing(comment_count_obj[ObjectFromPostingMap.docId])}
                                <a u-id="${ObjectFromPostingMap.uid}" i-id="${ObjectFromPostingMap.docId}" class="a_read_detail_article"><button class="btn btn-primary"><span class="fas fa-book-open mr-2"></span>Read</button></a>
                            </div>
                        </div>
                    </div>                                
                </div>
            </div>
        </div>    
    `);   
}

$(document).ready ( function () {
    //탈퇴 버튼
    $('#a_quit_account_btn').click(my_custom_vars.userDeleteAccount);       //함수뒤에 ()붙이지 말것. 바로 실행됨
    //로그아웃 버튼
    $('#logout_btn').click(my_custom_vars.userLogout);
    //관리자 메일 버튼
    $("body").on('click', '#btn_contact_administrator', my_custom_vars.sendMailToAdmin);
});

//화면 아래 쿠키로 Adblock 안내 하는 팝업
function createOfferBar(){    
    var b = document.createElement("div");
    b.setAttribute("id","ofBar");
    $(b).append(`
    <div id="ofBar-logo">
        <img alt="logo" src="/img/top_logo.png" style="max-width: 92px;">
    </div>        
    <div id="ofBar-content">If you can't see the diary photo, please exclude the English diary site from the Adblock block list.
    </div>
    <div id="ofBar-right">            
        <a id="close-bar">×</a>
    </div>
    `);    
    $('body').append($(b));
}
function closeOfferBar(){
    document.getElementById("ofBar").setAttribute("style","display:none");
    my_custom_vars.setCookie("guide_remove_adblock_bar","true", 14);        //14 일 가지고 있는 쿠키
}
var cookie_bottom_guide_value = my_custom_vars.getCookie("guide_remove_adblock_bar");
// guide_remove_adblock_bar를 키로 하는 쿠키값이 없으면, bottom팝업을 만듬
''==cookie_bottom_guide_value && (createOfferBar(), document.getElementById("close-bar").addEventListener("click",closeOfferBar));