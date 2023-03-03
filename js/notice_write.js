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
function downloadFireDBInfo() {     //profileImages, InfoUser 콜렉션
    db.collection("usersInfo").withConverter(my_custom_vars.infoUserConverter).get().then(
        (querySnapshot) => {
            querySnapshot.forEach((doc) => {
                usersInfoMap.set(doc.id, doc.data());      //문서명(유저uid)가 key
            });
            sayHelloToUser();
            my_custom_vars.changeIconIfExistRecentNotice();        //신규 공지사항 확인 후 icon 교체
        }
    );
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
$(document).ready(function(){   
   $(document).on('change','.up', function(){
   	var id = $(this).attr('id'); /* gets the filepath and filename from the input */
	   var profilePicValue = $(this).val();       
	   var fileNameStart = profilePicValue.lastIndexOf('\\'); /* finds the end of the filepath */
       //파일명 시작 부분부터~20자를 가져오네. 단 화면에 표시되는 이름만 그런 것이라고 봐야. 실제 파일명은 20자 이상일때도 그대로임
	   profilePicValue = profilePicValue.substr(fileNameStart + 1).substring(0,150); /* isolates the filename */ 
	   //var profilePicLabelText = $(".upl"); /* finds the label text */
	   if (profilePicValue != '') {	   	
          $(this).closest('.fileUpload').find('.upl').html('');     /* changes the label text */
          $(this).closest('.fileUpload').css('text-align', 'center');
          $(this).closest('.uploadDoc').find(".my_label_file_name").val(profilePicValue);
	   }
   });

   function appendNewUploadFileLine() {
        $("#uploader").append(`
        <div class="d-flex uploadDoc">
            <div class="col-3">
                <div class="docErr">Please upload valid file</div>
                <div class="fileUpload btn btn-orange">
                    <img src="/img/file_type_icon/default.svg" class="icon">
                    <span class="upl" id="upload">Click here</span>
                    <input type="file" class="upload up" id="up" onchange="readURL(this);" />
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

   $(".btn-new").on('click',function(){
        appendNewUploadFileLine();
   });
    
   $(document).on("click", "a.btn-check" , function() {     // x 버튼 리스너
        $(this).closest(".uploadDoc").remove();
        if($(".uploadDoc").length == 0){
            swal('Every attachment has cleared', 'Now you can upload notice without files.', 'info');
            appendNewUploadFileLine();
        }     
   });
});

var storedFilesMap = new Map();
//이미지 다중 선택 및 순서 변경 코드 with Jquery UI
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
        //input에서 file 객체 제대로 들어있는 것만 Map에 담음
        for (let i = 0; i < $('.uploadDoc').length; i++) {
            var current_input = $('.uploadDoc').eq(i).find(".up").eq(0)[0];            
            if( current_input && current_input.files[0]){   //빈 input이 아니라면                
                //키:파일명, 값:file객체 로 Map에 넣음
                storedFilesMap.set(current_input.files[0].name, current_input.files[0]);      
            }
        }
        if (storedFilesMap.size == 0) {     //첨부파일 없이 그냥 올리는 경우            
            let data = new my_custom_vars.NoticeDTO();
            data.title = ($('#title_article').val()).toString().trim();
            data.uid = firebase.auth().currentUser?.uid;
            data.timestamp = new Date().getTime();      //timestamp 는 db 업뎃 시간 기준
            data.fileDownloadLinkArray = [];
            data.fileNameArray = [];            
            data.content = ($('#content_article').val()).toString().trim();
            db.collection('notices').doc().withConverter(my_custom_vars.noticeConverter).set(data).then(()=>{
                hideLoading();
                window.location.href = '/bulletin_board.html';
            }).catch( error =>{
                hideLoading();
                my_custom_vars.showSwalErrorMessage_db(error);
            });
            return;
        }

        // 업로드 끝난 파일 url 담을 배열 준비
        var upload_complete_files_url = [];
        for (let i = 0; i < storedFilesMap.size; i++) {
            upload_complete_files_url.push('empty');            
        }        

        //Map에서 파일 하나씩 업로드 하되, 업로드 끝나면, 순서index대로 배열에 넣기
        var index = 0;
        for (const [key, value] of storedFilesMap.entries()) {
            saveFileSrcToStorageReceiveUrl(index, value, key);      //key가 파일명, value가 file객체
            index++;
        }

        function setDBInfo_after_upload_completion() {
            if(upload_complete_files_url.includes('empty')) return;
            var data = new my_custom_vars.NoticeDTO();
            data.title = ($('#title_article').val()).toString().trim();
            data.uid = firebase.auth().currentUser?.uid;
            data.timestamp = new Date().getTime();      //timestamp 는 db 업뎃 시간 기준
            data.fileDownloadLinkArray = upload_complete_files_url;
            for (const [key, value] of storedFilesMap.entries()) {
                data.fileNameArray.push(key);
            }            
            data.content = ($('#content_article').val()).toString().trim();

            db.collection('notices').doc().withConverter(my_custom_vars.noticeConverter).set(data).then(()=>{
                hideLoading();
                window.location.href = '/bulletin_board.html';
            }).catch( error =>{
                hideLoading();
                my_custom_vars.showSwalErrorMessage_db(error);
            });
        }

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
                    setDBInfo_after_upload_completion();
                });
            });            
        }        
    });
    
});

$(document).ready ( function () {
    //탈퇴 버튼
    $('#a_quit_account_btn').click(my_custom_vars.userDeleteAccount);       //함수뒤에 ()붙이지 말것. 바로 실행됨
    //로그아웃 버튼
    $('#logout_btn').click(my_custom_vars.userLogout);
});