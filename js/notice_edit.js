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

function isBlankOrEmptyString(str) {        //비어있거나 공백인 문자열인 경우 -> true 반환
    return !str || !(str.toString().trim());
}
function chooseIconWithExtension(filename) {
    let extension = filename.split('.').pop().toLowerCase();
    var result = '';
    switch (extension) {
        case 'doc':
            result = '/img/file_type_icon/doc.svg';
            break;
        case 'docx':
            result = '/img/file_type_icon/docx.svg';
            break;
        case 'jpeg':            
            result = '/img/file_type_icon/jpeg.svg';
            break;
        case 'jpg':
            result = '/img/file_type_icon/jpg.svg';
            break;
        case 'pdf':
            result = '/img/file_type_icon/pdf.svg';
            break;
        case 'png':
            result = '/img/file_type_icon/png.svg';
            break;
        case 'rtf':
            result = '/img/file_type_icon/rtf.svg';
            break;
        case 'txt':
            result = '/img/file_type_icon/txt.svg';
            break;
        case 'xls':
            result = '/img/file_type_icon/xls.svg';
            break;
        case 'xlsx':
            result = '/img/file_type_icon/xlsx.svg';
            break;
        case 'zip':
            result = '/img/file_type_icon/zip.svg';
            break;
        default:
            result = '/img/file_type_icon/default.svg';
            break;
    }
    return result;
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

//기존 업로드했던 공지사항의 첨부파일 db 담을 배열 ( 요소가 문자열-원시타입-밖에 없어서 shallow copy만 해도 deep copy랑 동일효과)
var prev_fileDownloadLinkArray = [];        //기존파일삭제시 변경이 발생함 ( 새 파일 추가는 어차피 upload한 다음에 url생성이 가능함 )
var prev_fileNameArray = [];                //기존파일삭제, 새파일추가시 변경이 발생함

function loadNoticeToEdit() {
    var this_notice = noticesMap.get(my_custom_vars.getParameters('index'));
    //timestamp , uid 는 기존 글과 동일해야 하므로 처리안함. update시 set merge옵션으로 업데이트할 필드만 정의하면 됨
    $('#title_article').val(this_notice.title);         //제목
    $('#content_article').val(this_notice.content);     //공지사항 내용
    prev_fileDownloadLinkArray = [...this_notice.fileDownloadLinkArray];        //배열들은 shallow copy
    prev_fileNameArray = [...this_notice.fileNameArray];                        //배열들은 shallow copy
    
    for (let i = 0; i < prev_fileNameArray.length; i++) {       //애초에 첨부파일이 0개면, 여기 for문 실행안됨
        $("#uploader").append(`
        <div class="d-flex uploadDoc">
            <div class="col-3">
                <div class="docErr">Please upload valid file</div>
                <div class="fileUpload btn btn-orange text-center">
                    <img src="${chooseIconWithExtension(prev_fileNameArray[i])}" class="icon">
                    <span class="upl" id="upload"></span>
                    <input type="file" class="upload up" id="up" disabled style="cursor:default;" prev="existed">
                    <!-- 위 input에 prev 속성이 기존 첨부파일임을 의미. 수정 이후 업로드시 다르게 처리할 것-->
                </div>
            </div>
            <div class="col-8">
                <input type="text" readonly class="form-control my_label_file_name" name="" placeholder="" value="${prev_fileNameArray[i]}">
            </div>
            <div class="col-1">
                <a class="btn-check" prev="existed" filename="${prev_fileNameArray[i]}" fileDownLink="${prev_fileDownloadLinkArray[i]}"><i class="fa fa-times"></i></a>
            </div>
        </div>
        `);
    }    
    appendNewUploadFileLine();      //새롭게 업로드할 수 있는 줄을 한줄 넣어둠
}

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

var db = firebase.firestore();
var storage = firebase.storage();

// initialize Firebase
initFirebaseAuth();

var usersInfoMap = new Map();
var noticesMap = new Map();     //공지사항 콜렉션 담기
function downloadFireDBInfo() {     //notices, InfoUser 콜렉션
    db.collection("usersInfo").withConverter(my_custom_vars.infoUserConverter).get().then(
        (querySnapshot) => {
            querySnapshot.forEach((doc) => {
                usersInfoMap.set(doc.id, doc.data());      //문서명(유저uid)가 key
            });
            sayHelloToUser();
            db.collection('notices').doc(my_custom_vars.getParameters('index')).withConverter(my_custom_vars.noticeConverter).
            get().then( doc =>{
                if (doc.exists) {
                    var current_notice_obj = doc.data();
                    current_notice_obj.docId = doc.id;
                    noticesMap.set(doc.id, current_notice_obj);     //Map 안에는 현재 notice 하나밖에 없음                    
                }
                //db 세팅 끝났으면
                loadNoticeToEdit();
                my_custom_vars.changeIconIfExistRecentNotice();        //신규 공지사항 확인 후 icon 교체

            }).catch( error2 =>{
                hideLoading();
                my_custom_vars.showSwalErrorMessage_db(error2);
            });
        }
    ).catch(error =>{
        hideLoading();
        my_custom_vars.showSwalErrorMessage_db(error);
    });
}

function readURL(input) {
    if (input.files && input.files[0]) {
        var extension = input.files[0].name.split('.').pop().toLowerCase();  //file extension from input file        
        var reader = new FileReader();
        reader.onload = function (e) {
            if (extension == 'doc'){
                //가장 가까운 fileUpload 요소 하나 가져와서 하위에서 icon클래스 가진 img태그 찾아서 이미지 지정함
                $(input).closest('.fileUpload').find(".icon").attr('src','/img/file_type_icon/doc.svg');
            }else if (extension == 'docx'){
                $(input).closest('.fileUpload').find(".icon").attr('src','/img/file_type_icon/docx.svg');
            }else if (extension == 'jpeg'){
                $(input).closest('.fileUpload').find(".icon").attr('src','/img/file_type_icon/jpeg.svg');
            }else if (extension == 'jpg'){
                $(input).closest('.fileUpload').find(".icon").attr('src','/img/file_type_icon/jpg.svg');
            }else if (extension == 'pdf'){
                $(input).closest('.fileUpload').find(".icon").attr('src','/img/file_type_icon/pdf.svg');
            }else if (extension == 'png'){ 
                $(input).closest('.fileUpload').find(".icon").attr('src','/img/file_type_icon/png.svg'); 
            }else if (extension == 'rtf'){
                $(input).closest('.fileUpload').find(".icon").attr('src','/img/file_type_icon/rtf.svg');
            }else if (extension == 'txt'){
                $(input).closest('.fileUpload').find(".icon").attr('src','/img/file_type_icon/txt.svg');
            }else if (extension == 'xls'){
                $(input).closest('.fileUpload').find(".icon").attr('src','/img/file_type_icon/xls.svg');
            }else if (extension == 'xlsx'){
                $(input).closest('.fileUpload').find(".icon").attr('src','/img/file_type_icon/xlsx.svg');
            }else if (extension == 'zip'){
                $(input).closest('.fileUpload').find(".icon").attr('src','/img/file_type_icon/zip.svg');
            }else {     //지정한 파일 형식에 해당되지 않을 때                
                $(input).closest('.fileUpload').find(".icon").attr('src','/img/file_type_icon/default.svg');
                $(input).closest('.uploadDoc').find(".docErr").slideUp('slow');
            }            
            //파일을 한번 가져왔으면 다시 클릭 못하게 만듬. 왜냐하면 파일 선택한번 하고, 다시 선택창 들어가서
            // 취소하면 파일이 실제론 input에 없는데, 있는 것처럼 보이는 현상이 발생하므로.
            input.disabled = true;
            input.style.cursor = "default";
        }
        reader.readAsDataURL(input.files[0]);        
    }
}

function appendNewUploadFileLine() {    
     $("#uploader").append(`
     <div class="d-flex uploadDoc">
         <div class="col-3">
             <div class="docErr">Please upload valid file</div>
             <div class="fileUpload btn btn-orange">
                 <img src="/img/file_type_icon/default.svg" class="icon">
                 <span class="upl" id="upload">Click here</span>
                 <input type="file" class="upload up" id="up" onchange="readURL(this);">
             </div>
         </div>
         <div class="col-8">
             <input type="text" readonly class="form-control my_label_file_name" name="" placeholder="">
         </div>
         <div class="col-1">
             <a class="btn-check"><i class="fa fa-times"></i></a>
         </div>
     </div>
     `);       
}

var files_arr_to_delete = [];       //기존 글에 첨부되어 있던 파일명 중에 삭제할 파일의 이름을 담는 배열
$(document).ready(function(){   
   $(document).on('change','.up', function(){
   	var id = $(this).attr('id'); /* gets the filepath and filename from the input */
	   var profilePicValue = $(this).val();       
	   var fileNameStart = profilePicValue.lastIndexOf('\\'); /* finds the end of the filepath */
       //파일명 시작 부분부터~20자를 가져오네. 단 화면에 표시되는 이름만 그런 것이라고 봐야. 실제 파일명은 20자 이상일때도 그대로임
	   profilePicValue = profilePicValue.substr(fileNameStart + 1).substring(0,150); /* isolates the filename */ 	   
	   if (profilePicValue != '') {	   	
          $(this).closest('.fileUpload').find('.upl').html('');     /* changes the label text */
          $(this).closest('.fileUpload').css('text-align', 'center');
          $(this).closest('.uploadDoc').find(".my_label_file_name").val(profilePicValue);
          prev_fileNameArray.push(profilePicValue);         //이번 수정시에 새롭게 추가된 파일명을 배열에 담음
	   }
   });   

   $(".btn-new").on('click',function(){       
        appendNewUploadFileLine();
   });
    
   $(document).on("click", "a.btn-check" , function(){     // x 버튼 리스너
        if($(this).attr('prev') == 'existed'){
            files_arr_to_delete.push($(this).attr('filename'));  //Storage 에서 기존 파일 삭제용
            //기존 filename 배열에서 현재 삭제한 행의 파일명을 찾아 삭제
            if (prev_fileNameArray.indexOf($(this).attr('filename')) > -1) {
                prev_fileNameArray.splice(prev_fileNameArray.indexOf($(this).attr('filename')), 1);
            }
            // 기존 fileDownloadLink 배열에서 현재 삭제한 행의 링크를 찾아 삭제
            if (prev_fileDownloadLinkArray.indexOf($(this).attr('fileDownLink')) > -1) {
                prev_fileDownloadLinkArray.splice(prev_fileDownloadLinkArray.indexOf($(this).attr('fileDownLink')), 1);
            }
        }

        $(this).closest(".uploadDoc").remove();
        if($(".uploadDoc").length == 0){
            swal('Every attachment has cleared', 'Now you can upload notice without files.', 'info');
            appendNewUploadFileLine();
        }
   });
});

var storedFilesMap = new Map();         //수정시에 새롭게 추가된 파일만 담게 될 Map
//jQuery(document).ready 도 $(document).ready() 와 동일하다고 봐야
jQuery(document).ready(function() {                   
    //Notice Upload method
    $('body').on('click', '#upload_btn', function(e){
        //글 제목 또는 내용 없으면 리턴
        if ( isBlankOrEmptyString($('#content_article').val()) || isBlankOrEmptyString($('#title_article').val()) ) {        
            swal('Warning', 'There is no notice title or content. Please check it.', 'error');
            return;
        }        
        showLoading();              //로딩 이미지 띄움.
        e.preventDefault();
        //input에서 file 객체 제대로 들어있는 것, 그리고 이번 수정시에 새롭게 추가한 파일만 storedFilesMap에 담음
        for (let i = 0; i < $('.uploadDoc').length; i++) {
            var current_input = $('.uploadDoc').eq(i).find(".up").eq(0)[0];
            //빈 input이 아니며, 기존 파일이 아니라면
            if( current_input && current_input.files[0] && $(current_input).attr('prev')!='existed'){
                //키:파일명, 값:file객체 로 Map에 넣음
                storedFilesMap.set(current_input.files[0].name, current_input.files[0]);      
            }
        }
        
        let delete_comeplete_count = 0;
        if (storedFilesMap.size == 0) {     //일단 이번 수정시에 새롭게 추가한 첨부파일 없을 때
            if (files_arr_to_delete.length != 0) {      //이번 수정시에 기존 파일을 삭제한 것이 있다면
                for (let i = 0; i < files_arr_to_delete.length; i++) {
                    storage.ref('notices/'+firebase.auth().currentUser.uid+'/'+files_arr_to_delete[i]).delete().then(
                        function() {
                            delete_comeplete_count++;
                            if (delete_comeplete_count == files_arr_to_delete.length) {
                                db.collection('notices').doc(my_custom_vars.getParameters('index')).set({
                                    title : ($('#title_article').val()).toString().trim(),      //제목 수정
                                    content : ($('#content_article').val()).toString().trim(),   //내용 수정
                                    fileDownloadLinkArray : prev_fileDownloadLinkArray,     //파일링크 배열 수정
                                    fileNameArray : prev_fileNameArray                      //파일명 배열 수정
                                }, {merge : true}
                                ).then(()=>{
                                    hideLoading();
                                    window.location.href = '/bulletin_board.html';
                                }).catch( error =>{
                                    hideLoading();
                                    my_custom_vars.showSwalErrorMessage_db(error);
                                });
                            }                            
                        }
                    ).catch(
                        function(error){
                            hideLoading();
                            my_custom_vars.showSwalErrorMessage_storage(error);
                            return;
                        }
                    );
                }
            }else{              //새롭게 추가한 첨부도 없고, 기존 파일 삭제도 없음. 제목, 내용 정도만 수정한 경우
                db.collection('notices').doc(my_custom_vars.getParameters('index')).set({
                    title : ($('#title_article').val()).toString().trim(),      //제목 수정
                    content : ($('#content_article').val()).toString().trim()   //내용 수정
                }, {merge : true}
                ).then(()=>{
                    hideLoading();
                    window.location.href = '/bulletin_board.html';
                }).catch( error =>{
                    hideLoading();
                    my_custom_vars.showSwalErrorMessage_db(error);
                });
            }                        
        }else{          //이번 수정시에 새롭게 추가한 첨부파일이 존재할 때!!
            if (files_arr_to_delete.length != 0) {      //이번 수정시에 기존 파일을 삭제한 것이 있다면                
                //파일 삭제 이후 업로드 시작할 것
                for (let i = 0; i < files_arr_to_delete.length; i++) {
                    storage.ref('notices/'+firebase.auth().currentUser.uid+'/'+files_arr_to_delete[i]).delete().then(
                        function() {
                            delete_comeplete_count++;
                            if (delete_comeplete_count == files_arr_to_delete.length) {     //기존 파일 삭제는 완료. 새파일 업로드 시작
                                function saveFileSrcToStorageReceiveUrl(index, file, filename) {
                                    // Storage 파일 저장 경로 : notices / 유저uid / 원래파일명
                                    var noticeFileRef = storage.ref('notices/'+firebase.auth().currentUser.uid+"/"+filename);
                                    var uploadTask = noticeFileRef.put(file);
                                    uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, function(snapshot){
                                        //업로드 진행중 리스너
                                    }, function(error){     // 업로드 실패 리스너
                                        my_custom_vars.showSwalErrorMessage_storage(error);
                                        hideLoading();
                                    }, function(){      //업로드 성공 리스너
                                        uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL){
                                            upload_complete_files_url[index] = downloadURL;
                                            if(!(upload_complete_files_url.includes('empty'))){     //새 파일 전부 업로드 완료시에만
                                                prev_fileDownloadLinkArray = prev_fileDownloadLinkArray.concat(upload_complete_files_url);  //기존 링크 배열과, 새 업로드파일링크 배열 합치기
                                                db.collection('notices').doc(my_custom_vars.getParameters('index')).set({
                                                    title : ($('#title_article').val()).toString().trim(),      //제목 수정
                                                    content : ($('#content_article').val()).toString().trim(),   //내용 수정
                                                    fileDownloadLinkArray : prev_fileDownloadLinkArray,     //파일링크 배열 수정
                                                    fileNameArray : prev_fileNameArray                      //파일명 배열 수정
                                                }, {merge : true}
                                                ).then(()=>{
                                                    hideLoading();
                                                    window.location.href = '/bulletin_board.html';
                                                }).catch( error =>{
                                                    hideLoading();
                                                    my_custom_vars.showSwalErrorMessage_db(error);
                                                });
                                            }
                                        });
                                    });            
                                }   
                                // 업로드 끝난 파일 url 담을 배열 준비
                                var upload_complete_files_url = [];
                                for (let k = 0; k < storedFilesMap.size; k++) {
                                    upload_complete_files_url.push('empty');
                                }
                                var index_in_new_arr = 0;       //업로드 끝난 파일 담는 배열에 순서를 지정하기 위한 것에 불과.
                                for(const [key, value] of storedFilesMap.entries()){
                                    saveFileSrcToStorageReceiveUrl(index_in_new_arr, value, key);      //key가 파일명, value가 file객체
                                    index_in_new_arr++;
                                }
                            }                            
                        }
                    ).catch(
                        function(error){
                            hideLoading();
                            my_custom_vars.showSwalErrorMessage_storage(error);
                            return;
                        }
                    );
                }
            }else{          //이번 수정시에 기존 파일 삭제는 없고, 새롭게 파일 올린 것만 있다면
                //사실상 위 분기에서 기존파일 삭제 부분만 삭제한 것
                function saveFileSrcToStorageReceiveUrl(index, file, filename) {
                    // Storage 파일 저장 경로 : notices / 유저uid / 원래파일명
                    var noticeFileRef = storage.ref('notices/'+firebase.auth().currentUser.uid+"/"+filename);
                    var uploadTask = noticeFileRef.put(file);
                    uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, function(snapshot){
                        //업로드 진행중 리스너
                    }, function(error){     // 업로드 실패 리스너
                        my_custom_vars.showSwalErrorMessage_storage(error);
                        hideLoading();
                    }, function(){      //업로드 성공 리스너
                        uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL){
                            upload_complete_files_url[index] = downloadURL;
                            if(!(upload_complete_files_url.includes('empty'))){     //새 파일 전부 업로드 완료시에만
                                prev_fileDownloadLinkArray = prev_fileDownloadLinkArray.concat(upload_complete_files_url);  //기존 링크 배열과, 새 업로드파일링크 배열 합치기
                                db.collection('notices').doc(my_custom_vars.getParameters('index')).set({
                                    title : ($('#title_article').val()).toString().trim(),      //제목 수정
                                    content : ($('#content_article').val()).toString().trim(),   //내용 수정
                                    fileDownloadLinkArray : prev_fileDownloadLinkArray,     //파일링크 배열 수정
                                    fileNameArray : prev_fileNameArray                      //파일명 배열 수정
                                }, {merge : true}
                                ).then(()=>{
                                    hideLoading();
                                    window.location.href = '/bulletin_board.html';
                                }).catch( error =>{
                                    hideLoading();
                                    my_custom_vars.showSwalErrorMessage_db(error);
                                });
                            }
                        });
                    });            
                }   
                // 업로드 끝난 파일 url 담을 배열 준비
                var upload_complete_files_url = [];
                for (let k = 0; k < storedFilesMap.size; k++) {
                    upload_complete_files_url.push('empty');
                }
                var index_in_new_arr = 0;       //업로드 끝난 파일 담는 배열에 순서를 지정하기 위한 것에 불과.
                for(const [key, value] of storedFilesMap.entries()){
                    saveFileSrcToStorageReceiveUrl(index_in_new_arr, value, key);      //key가 파일명, value가 file객체
                    index_in_new_arr++;
                }
            }
        }              
    });
    
});

$(document).ready ( function () {
    //탈퇴 버튼
    $('#a_quit_account_btn').click(my_custom_vars.userDeleteAccount);       //함수뒤에 ()붙이지 말것. 바로 실행됨
    //로그아웃 버튼
    $('#logout_btn').click(my_custom_vars.userLogout);
});