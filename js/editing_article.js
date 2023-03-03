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

Object.defineProperty(Date.prototype, 'yyyyMMdd_HHmmss', {
    value: function() {
        function pad2(n) {  // always returns a string
            return (n < 10 ? '0' : '') + n;
        }

        return this.getFullYear() +
               pad2(this.getMonth() + 1) + 
               pad2(this.getDate()) +'_'+
               pad2(this.getHours()) +
               pad2(this.getMinutes()) +
               pad2(this.getSeconds());
    }
});

// Initiate firebase auth.
function initFirebaseAuth() {
    // Listen to auth state changes.
    firebase.auth().onAuthStateChanged(authStateObserver);    
}

// Triggers when the auth state change for instance when the user signs-in or signs-out.
function authStateObserver(user) {
    if (user) { // User is signed in!
        downloadFireDBInfo();        
    } else { // User is signed out!
                
    }
}

function isBlankOrEmptyString(str) {        //비어있거나 공백인 문자열인 경우 -> true 반환
    return !str || !(str.toString().trim());
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

var db = firebase.firestore();
var storage = firebase.storage();

// initialize Firebase
initFirebaseAuth();

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
function decorateProfileCard(){
    //현재 자신 프로필 이미지
    $('#img_profile_card_img').attr('src', getProfileImgOrDefaultValue(profileMap.get(firebase.auth().currentUser.uid)) );  
    $('#img_profile_card_img').css('object-fit', setOptionCoverOrContainByExistenceProfileImg(profileMap.get(firebase.auth().currentUser.uid)) );       //이미지 있으면 cover꽉차게, 없으면 contain으로
    $('#h3_profile_card_name').text(filterXSS(usersInfoMap.get(firebase.auth().currentUser.uid).name));      //프로필 카드 이름
    $('#p_profile_selfIntro').text(filterXSS(getSelfIntroOrDefaultValue(usersInfoMap.get(firebase.auth().currentUser.uid)))); //자기 소개
    //프로필 사진 젤 아래 프로바이더 표시 버튼
    $('#a_provider_show_email_btn').attr('href', 'mailto:'+firebase.auth().currentUser?.email);
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

var result_grouped_obj = {};
function posting_groupByMonth() {
    result_grouped_obj = {};
    var grouping = function(x) {
        var key = moment(x.timestamp).format('yyyy.MM');                
        
        if (result_grouped_obj[key] === undefined) {            
            result_grouped_obj[key] = [];
        }
        result_grouped_obj[key].push(x);
    }
    _.map(postingArray, grouping);    
    for(month_key in result_grouped_obj){
        $('#ul_right_sidebar').append(`
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
            $('#ul_right_sidebar > li:last-child ul').append(`
                <li><a class="a_my_prev_article"u-id="${contentDTO.uid}" d-id="${contentDTO.docId}">${filterXSS(contentDTO.title)}</a></li>
            `);            
        }        
    }
    $('.a_my_prev_article').on('click', function() {
        window.location.href = `/read_detail_one_article.html?index=${$(this).attr('d-id')}&u=${$(this).attr('u-id')}`;
    });    
}

function loadMyArticleToEdit() {        //수정할 글 불러와서 제목, 사진 등을 화면에 표시
    showLoading();    
    var doc_id = my_custom_vars.getParameters('index');
    var this_article = undefined;
    for (let i = 0; i < postingArray.length; i++) {
        if (postingArray[i].docId == doc_id) {
            this_article = postingArray[i];
            break;
        }        
    }
    $('#title_article').val(this_article.title);       //제목
    $('#content_article').val(this_article.explain);     //글 내용
    //carousel에 수정하려는 일기의 사진 표시 ( input에서 파일 불러올 때랑 똑같이 배열에 추가함 )
    $('#pic_Carousel').css('display', 'block');     //Carousel 틀 보이게
    for (let i = 0; i < this_article.imageArr.length; i++) {
        var filename = (this_article.imageArr[i].substr(this_article.imageArr[i].indexOf('JPEG'), this_article.imageArr[i].length)).split('_.png')[0]+'_.png';
        $('.cvf_uploaded_files').append(
            "<li file = '" + filename + "'>" +                                
                "<img title = 'Drag to reorder' class = 'img-thumb' src = '" + this_article.imageArr[i] + "' />" +
                "<a class = 'cvf_delete_image' title = 'Delete'><img class = 'delete-btn' src = '/img/delete-btn.png' /></a>" +
            "</li>"
        );
        $('#div_carousel-inner').append(`
            <div class="carousel-item" style="height:630px;">
                <img class="d-block" style="margin: auto; position: absolute; top: 0; left: 0; right: 0; bottom: 0;" src="${this_article.imageArr[i]}" alt="" file="${filename}">
            </div>
        `);
        
        const urlToObject= async()=> {            
            const response = await fetch(this_article.imageArr[i]);
            const blob = await response.blob();
            var filename = (this_article.imageArr[i].substr(this_article.imageArr[i].indexOf('JPEG'), this_article.imageArr[i].length)).split('_.png')[0]+'_.png';
            const file = new File([blob], filename, {type: blob.type});            
            storedFiles.push(file);            
            // var reader = new FileReader();
            // reader.onload =  function(e){
            //     $('.cvf_uploaded_files').append(
            //         "<li file = '" + filename + "'>" +
            //             "<img title = 'Drag to reorder' class = 'img-thumb' src = '" + e.target.result + "' />" +
            //             "<a class = 'cvf_delete_image' title = 'Delete'><img class = 'delete-btn' src = '/img/delete-btn.png' /></a>" +
            //         "</li>"
            //     );
            //     $('#div_carousel-inner').append(`
            //         <div class="carousel-item" style="height:630px;">
            //             <img class="d-block" style="margin: auto; position: absolute; top: 0; left: 0; right: 0; bottom: 0;" src="${e.target.result}" alt="" file="${filename}">
            //         </div>
            //     `);
            //     console.log('e.target.result:', e.target.result);
            // };
            
            // reader.readAsDataURL(file);     //request.response 이게 File 객체 ( Blob 객체 )
        }
        urlToObject();

        //마지막 파일을 처리했을 때
        if(this_article.imageArr.length == (i+1)){
            hideLoading();
            if ($('.div_surround_ul_uploded_files').css('display') == 'none') {
                $('.div_surround_ul_uploded_files').css('display', 'block');
                $('#div_reorder_guide_message').css('display', 'block');
            }
            setTimeout(function(){
                cvf_add_order();
                $('#p_picture_count').text(`picture count : ${this_article.imageArr.length}`);
                carousel_add_order();
                attach_active_first_carousel();
            }, 1000);
            // 미리보기 전부 표시 후, 1초후에 각각의 li태그에 item=0,1,2..를 붙임
        }
    }
    hideLoading();
}

var postingArray = [];
var profileMap = new Map();
var usersInfoMap = new Map();

function downloadFireDBInfo() {     //profileImages, InfoUser 콜렉션
    db.collection("profileImages").withConverter(my_custom_vars.profileImageConverter).get().then(
        (querySnapshot) => {
            querySnapshot.forEach((doc)=>{
                profileMap.set(doc.id, doc.data());         //문서명(유저uid)가 key
            });
            db.collection("usersInfo").withConverter(my_custom_vars.infoUserConverter).get().then(
                (querySnapshot2) => {
                    querySnapshot2.forEach((doc2) => {
                        usersInfoMap.set(doc2.id, doc2.data());      //문서명(유저uid)가 key
                    });
                    sayHelloToUser(); 
                    decorateProfileCard();
                    //기본 정렬인 오름차순으로 timestamp 정렬해서 문서 받아오고, 글쓴이 것만 챙김
                    db.collection("images").orderBy("timestamp", "desc").withConverter(my_custom_vars.contentDTOConverter).get().then((querySnapshot3) => {
                        querySnapshot3.forEach((doc3) => {
                            if (doc3.data().uid == firebase.auth().currentUser.uid) {       //자기 글만
                                var contentDTO_plus_docId = doc3.data();
                                contentDTO_plus_docId.docId = doc3.id;      //각 일기 객체에 docId 란 프로퍼티를 추가해서 문서이름 담아놓음
                                postingArray.push(contentDTO_plus_docId);
                            }                            
                        });
                        posting_groupByMonth();
                        loadMyArticleToEdit();
                        my_custom_vars.changeIconIfExistRecentNotice();        //신규 공지사항 확인 후 icon 교체
                    });
                }
            );
        }        
    ).catch(error => {
        my_custom_vars.showSwalErrorMessage_db(error);        
    });
}

// Apply sort function . 실행 되고 있는 타이밍 : 그림 순서 바꿨을때, 그림 삭제했을때, 순서안바꾸고
//그대로 올릴경우 업로드 시, 그림 첨 선택했을 때 <= 이건 내가 추가.
// reload_order()를 해야, hidden_field input에 값이 들어감.
function cvf_reload_order() {        
    // ul (클래스 cvf_uploaded_files) 태그를 sortable 하게.
    // toArray() 는 정렬 가능한 항목 ID를 문자열 배열로 직렬화히고, attribute:'item'은 가져올 속성을 지정함
    var order = $('.cvf_uploaded_files').sortable('toArray', {attribute: 'item'});
    // input (cvf_hidden_field) 태그에 value 속성에 order 를 설정
    $('.cvf_hidden_field').val(order);
}

function cvf_add_order() {                
    //가져온 항목들이 목록으로 보이는 ul 태그 아래의 li 들에 item 속성에 n(0,1,2...)을 배정.
    //li 태그 아래에는 img태그와 삭제버튼인 a태그가 붙음
    $('.cvf_uploaded_files li').each(function(n) {
        $(this).attr('item', n);            
    });
    cvf_reload_order();          //li들을 추가했으면 바로 reload_order 실행
}
function carousel_add_order() {
    $('#div_carousel-inner img').each(function(n) {
        $(this).attr('item', n);            
    });
}
//모든 Carousel div 에 active 를 없애고 제일 첫 div 하나에만 active 클래스 붙임
function attach_active_first_carousel() {
    $('#div_carousel-inner div').each(function(n) {
        $(this).removeClass('active');
    });
    $('#div_carousel-inner div:first-child').addClass('active');
}

var storedFiles = [];      

//이미지 다중 선택 및 순서 변경 코드 with Jquery UI
//jQuery(document).ready 도 $(document).ready() 와 동일하다고 봐야
jQuery(document).ready(function() {        
    function change_carousel_order() {
        var fileAttr_arr = [];
        $('.cvf_uploaded_files li').each(function(n) {
            fileAttr_arr.push($(this).attr('file'));
        });

        var div_carousels_arr = [];
        $('#div_carousel-inner div').each(function(n) {
            div_carousels_arr.push(this);
        });

        var new_ordered_carousels = [];
        for (let i = 0; i < fileAttr_arr.length; i++) {
            const file_name = fileAttr_arr[i];

            for (let j = 0; j < div_carousels_arr.length; j++) {
                if (file_name == $(div_carousels_arr[j]).children('img').attr('file')) {
                    new_ordered_carousels.push(div_carousels_arr[j]);
                    break;
                }                
            }            
        }
        $('#div_carousel-inner').empty();
        for (let i = 0; i < new_ordered_carousels.length; i++) {
            $('#div_carousel-inner').append(new_ordered_carousels[i]);                        
        }
        attach_active_first_carousel();
    }
   
    // $(function(){}) 은... $(document).ready(function() { ... }) 를 단축하여 쓰는 것
    $(function() {                
        $('.cvf_uploaded_files').sortable({     // ul 태그를 sortable하게 설정
            cursor: 'move',             // 드래그할 때 마우스 커서 모양 변경
            placeholder: 'highlight',   // 드래그할 때, 이동되는 하위요소가 highlight 클래스를 가지고, css에서 움직이는 사진 뒤 배경색 등을 지정
            start: function (event, ui) {       //드래그 시작(이벤트)시 highlight 클래스를 토글함
                ui.item.toggleClass('highlight');                
            },
            stop: function (event, ui) {        //드래그 종료(이벤트)시 highlight 클래스를 토글함
                ui.item.toggleClass('highlight');                
            },
            update: function () {       //update: 사용자가 정렬을 중지하고, DOM 위치가 변경되면 작동하는 트리거
                cvf_reload_order();
                change_carousel_order();                
            },
            create:function(){      // 이벤트(sortable이 만들어졌을 때 실행)
            }
        });
        // ul태그(cvf_uploaded_files) 에서 혹 선택된 text contents를 선택해제한다. (Bad method. Dont' use this)
        $('.cvf_uploaded_files').disableSelection();        
    });
           
    //[업로드할 파일 선택] 에서의 input (user_picked_files) 이 변경시, 파일을 읽고, 미리보기 이미지를 띄움.
    //change 이벤트는 input, textarea, select 태그의 value의 변경을 의미
    $('body').on('change', '.user_picked_files', function() {  
        showLoading();                 
        var files = this.files;     //this는 input 태그(타입 : 파일)
        var i = 0;                           
        
        $('#pic_Carousel').css('display', 'block');     //Carousel 틀 보이게

        for (i = 0; i < files.length; i++) {
            var readImg = new FileReader();
            var file = files[i];                   
            if (file.type.match('image.*')){        //이미지 파일일때
                storedFiles.push(file);                
                //FileReader가 파일 read 성공시 수행할 동작 설정
                readImg.onload = (function(file) {
                    return function(e) {
                        //img-thumb 클래스로 css서 미리보기 사이즈를 정하고, 클릭 되는 a태그에 cvf_delete_image 클래스 지정해서
                        // 나중에 삭제 이미지 버튼 클릭시 배열과 미리보기 li태그에서 삭제하도록 함
                        $('.cvf_uploaded_files').append(
                            "<li file = '" + file.name + "'>" +                                
                                "<img title = 'Drag to reorder' class = 'img-thumb' src = '" + e.target.result + "' />" +
                                "<a class = 'cvf_delete_image' title = 'Delete'><img class = 'delete-btn' src = '/img/delete-btn.png' /></a>" +
                            "</li>"
                        );
                        $('#div_carousel-inner').append(`
                            <div class="carousel-item">
                                <img class="d-block w-100" src="${e.target.result}" alt="" file="${file.name}">
                            </div>
                        `);
                    };
                })(file);
                readImg.readAsDataURL(file);    //파일을 읽고, result속성에 파일을 나타내는 URL을 저장.
            } else {
                swal('Error', `The file ${file.name} is not an image`);                
            }
            
            //files 배열에서 마지막 파일을 처리했을 때
            if(files.length === (i+1)){
                hideLoading();                           
                if ($('.div_surround_ul_uploded_files').css('display') == 'none') {
                    $('.div_surround_ul_uploded_files').css('display', 'block');
                }
                setTimeout(function(){
                    cvf_add_order();
                    $('#p_picture_count').text(`picture count : ${storedFiles.length}`);
                    carousel_add_order();
                    attach_active_first_carousel();
                }, 1000);
                // 미리보기 전부 표시 후, 1초후에 각각의 li태그에 item=0,1,2..를 붙임
            }
        }
        hideLoading();
    });
   
    // Delete Image from Queue and Carousel
    $('body').on('click','a.cvf_delete_image',function(e){
        e.preventDefault();
        $(this).parent().remove('');       //미리보기 DOM 이미지 객체 제거
       
        var file = $(this).parent().attr('file');
        for(var i = 0; i < storedFiles.length; i++) {
            if(storedFiles[i].name == file) {                
                storedFiles.splice(i, 1);
                break;
            }
        }
        // carousel DOM 객체 제거
        for (let i = 0; i < $('#div_carousel-inner div').length; i++) {
            if (file == $('#div_carousel-inner div').eq(i).children('img').attr('file')) {
                $('#div_carousel-inner div').eq(i).remove();
                break;
            }
        }
        attach_active_first_carousel();
        $('#p_picture_count').text(`picture count : ${storedFiles.length}`);
        cvf_reload_order();               
    });

    //my upload method
    $('body').one('click', '#upload_btn', function(e){
        //글 내용 없거나, 사진 미지정시 리턴
        if (isBlankOrEmptyString($('#content_article').val()) || isBlankOrEmptyString($('#title_article').val()) 
            || $('#preview_image_box li').length == 0 ) {        
            swal('', 'No post title or content, or no photo specified.', 'error');
            return;
        }
        if ($('#preview_image_box li').length > 10) {
            swal('', 'Exceeded maximum number of photos. Please select 10 or fewer photos.', 'error');
            return;            
        }

        showLoading();              //로딩 이미지 띄움
        e.preventDefault();
        cvf_reload_order();

        //보낼 파일들 src 담은 배열 준비
        var ordered_file_arr = [];
        var ordered_created_filename_arr = [];
        var upload_complete_files_url = [];        
        
        $('#preview_image_box li').each(function(n) {
            let file_name = $(this).attr('file');
            for (let i = 0; i < $('#preview_image_box li').length; i++) {
                if (file_name == storedFiles[i].name) {
                    ordered_file_arr.push(storedFiles[i]);
                }                
            }
        });
        // Storage 저장 성공시 url 보내오면 담을 배열 파일 개수 맞춰서 준비
        for (let index = 0; index < ordered_file_arr.length; index++) {
            upload_complete_files_url.push('empty');
        }
        //현재 수정하고 있는 글의 기존 ContentDTO 를 뽑아서 나중에 필요한 정보를 미리 뽑아놓음 ( 왜냐면 이 db를 중간에 지우고 업로드 시작하므로)
        var this_article_obj = undefined;
        for (let i = 0; i < postingArray.length; i++) {
            if(postingArray[i].docId == my_custom_vars.getParameters('index')){
                this_article_obj = postingArray[i];
                break;
            }
        }        
        // Storage에 저장될 파일 이름 미리 배열에 준비. 단 여긴 수정이므로, 기존 db에 저장된 image파일 네임과 똑같이 처리한다.
        var now = this_article_obj.imageFileName.substring(0,20).substring(5);
        for (let index = 0; index < ordered_file_arr.length; index++) {
            ordered_created_filename_arr.push(`JPEG_${now}${index}_.png`);
        }
        //모든 파일이 Storage 저장 됐는지 확인후 DB 세팅하는 메소드.
        //주의!! 이건 새 db문서 만드는게 아니라 기존 문서 업데이트여야 함(덧글 및 좋아요 개수땜에)
        function updateDBInfo_after_upload_completion() {
            if (upload_complete_files_url.includes('empty')) return;                        
            
            db.collection("images").doc(this_article_obj.docId).set({
                title : $('#title_article').val(),
                explain : $('#content_article').val(),
                imageArr : upload_complete_files_url,
                imageFileName : (upload_complete_files_url[0].substr(upload_complete_files_url[0].indexOf('JPEG'), upload_complete_files_url[0].length)).split('_.png')[0]+'_.png',
                imageUrl : upload_complete_files_url[0]
            }, {merge: true}).then(()=>{
                //db 업데이트 성공시
                hideLoading();
                /*  푸시 보내는 코드... 는, 유나 일기는 만들되, 영어 일기에선 생략   */
                window.location.href=`/read_detail_one_article.html?index=${this_article_obj.docId}&u=${firebase.auth().currentUser.uid}`;
                //또는 여기에서 배지 확인하고 모달 띄우고 모달 없어지는 이벤트 발생시 이동시켜도 됨

            }).catch(error=>{
                // db 업뎃 실패시
                hideLoading();
                my_custom_vars.showSwalErrorMessage_db(error);                
            });                        
        }
        // 개별 파일 하나를 DB에 보내고 url을 배열에 저장하는 메소드
        function saveFileSrcToStorageReceiveUrl(index, file, filename) {
            //파일 저장 경로 : images / 유저uid / 파일명
            var imageRef = storage.ref('images/'+firebase.auth().currentUser.uid+"/"+filename);
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
                my_custom_vars.showSwalErrorMessage_storage(error);                
            },function(){
                //업로드 성공시 리스너
                uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL){
                    upload_complete_files_url[index] = downloadURL;
                    updateDBInfo_after_upload_completion();
                });
            });
        }

        function start_new_edited_fileUpload(){
            for (let i = 0; i < ordered_file_arr.length; i++) {
                saveFileSrcToStorageReceiveUrl(i, ordered_file_arr[i], ordered_created_filename_arr[i]);
            }                            
        }
        //올리기 전에.. 먼저 기존 사진 파일 삭제부터 ( 파일부터 순서대로 삭제 후 db 삭제 )
        var delete_success_count = 0;
        for (let i = 0; i < this_article_obj.imageArr.length; i++) {            
            var filename_toDel = (this_article_obj.imageArr[i].substr(this_article_obj.imageArr[i].indexOf('JPEG'), this_article_obj.imageArr[i].length)).split('_.png')[0]+'_.png';            

            storage.ref('images/'+firebase.auth().currentUser.uid+"/"+filename_toDel).delete().then(function(){
                delete_success_count++;
                if (delete_success_count == this_article_obj.imageArr.length) {      //기존 사진 파일 다 Storage에서 지웠으면
                    start_new_edited_fileUpload();
                }
            }).catch(error =>{
                my_custom_vars.showSwalErrorMessage_storage(error);
            });
        }                
    });
    $('#a_to_edit_my_profile').on('click', function() {
        window.location.href = `/edit_my_profile.html`;
    });
});

$(document).ready ( function () {
    //탈퇴 버튼
    $('#a_quit_account_btn').click(my_custom_vars.userDeleteAccount);       //함수뒤에 ()붙이지 말것. 바로 실행됨
    //로그아웃 버튼
    $('#logout_btn').click(my_custom_vars.userLogout);    
    //textarea 글 쓰는 부분 글자 개수 표시 리스너
    var oldVal = "";
    $("#content_article").on("change keyup paste", function() {
        var currentVal = $(this).val();
        if(currentVal == oldVal) {
            return; //check to prevent multiple simultaneous triggers
        }
        oldVal = currentVal;
        //action to be performed on textarea changed
        $('#p_article_length').text(`number of characters: ${$(this).val().length}`);
    });
});