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

function getProfileImgOrDefaultValue(obj) {
    var result = obj ? obj.image : '/img/user_without_profile.png';
    return result;
}

function setOptionCoverOrContainByExistenceProfileImg(obj) {
    var result = obj ? 'cover' : 'contain';
    return result;
}

function getSelfIntroOrDefaultValue(obj) {    
    var result = obj.selfIntro ? obj.selfIntro : "You haven't introduced yourself yet";
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

var my_prev_writing_record;     //과거 글 timestamp
var evenOnceWonPersonListMyClass = []; //당첨자 목록
//글 쓰기 완료했을 때, roullet 여부 체크가 시작되는데 이걸 미리 db 받아놓는 작업. usersInfoMap이 준비되고 나서 실행해야 함
function prepareDBdataForRoullete() {    
    db.collection("writingRecord").doc(firebase.auth().currentUser.uid).get().then(doc => {
        if (doc.exists) {
            my_prev_writing_record = Number(doc.data().timestamps);            

            // docName변수 => 타입은 number, rotary콜렉션에서 문서명을 의미함 ( 0, 1, 2...)
            let classNameIndex = my_custom_vars.classNameList.indexOf(usersInfoMap.get(firebase.auth().currentUser.uid).relation);
            db.collection("rotary").doc(String(classNameIndex)).get().then(doc2 => {
                if (doc2.exists) {                    
                    //자기 반의 당첨자 목록을 가져옴
                    evenOnceWonPersonListMyClass = doc2.data().wonPersonList;                    
                }
            }).catch(error2 => {
                my_custom_vars.showSwalErrorMessage_db(error2);
            });
        }
    }).catch(error => {
        my_custom_vars.showSwalErrorMessage_db(error);
    });
}

var weekSection = [];
function calculateThisWeekNumberth(just_written_timestamp) {
    // return 20; // 임시 임. 디버그용 (안 그러면 아직 수업전이라 0주가 계속 나오므로 당첨자는 0명 유지됨). 테스트 후 삭제할 것

    //myClassNameIndex 변수 타입은 number, rotary콜렉션에서 문서명을 의미함 ( 0, 1, 2...)
    let myClassNameIndex = my_custom_vars.classNameList.indexOf(usersInfoMap.get(firebase.auth().currentUser.uid).relation);
    var startMoment = moment(my_custom_vars.englishDiaryStartDay[myClassNameIndex]).valueOf();
    if (weekSection.length == 0) {      //구간 기준이 되는 배열이 아직 미생성이라면
        for (let i = 0; i < 20; i++) {
            weekSection.push(startMoment + (604800000*i));      //시작순간부터 일주일 단위의 밀리세컨드를 배열에 넣어줌
        }
    }
    if (moment(just_written_timestamp).valueOf() >= weekSection[weekSection.length-1]) {       //moment().valueOf() 는 밀리세컨드로 바꾸는 메소드
        return 20;      //수업 마지막 주수마저 넘은 시간에 일기를 올렸다면
        //아래 반복문에서 최대 나올수 있는 수 19 ( weekSection 의 길이-1 )
    }
    for (let i = 0; i < weekSection.length; i++) {
        if (moment(just_written_timestamp).valueOf() < weekSection[i]) {
            return i;
        }
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

function decorateProfileCard(){     //추후 추가사항 : 여기 나중에 각종 배지 표시하는 코드 넣어야 함
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
var isLotteryWon = false;
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

function rotaryMethod(numberCondition) {
    "use strict";       //좀더 silent한 오류를 예외를 던지게 만들고, 몇가지 추가될 수 있는 문법사용을 금지시킴. 좀 빨라질 수 있음.
  
    const items = [     //총 11개
      "🍀",      
      "🐋",
      "🦄",
      "🥤",      
      "💎",
      "😻",
      "🍦",
      "🎎",
      "🎌",
      "🌸",
      "🎏"
    ];
      
    const doors = document.querySelectorAll(".door");       // 총 3개의 열을 리스트로 bind
    document.querySelector("#spinner").addEventListener("click", spin);    
      
    async function spin() {
        $('#spinner').css('visibility','hidden');       //spin 버튼 숨김
        
        //firstInit이 false, 즉 card를 셔플해서 비로소 pool에 집어넣고
        init(false, 1, 2);            //groups는 1이니, items는 1세트 집어넣고, duration은 2이므로, 다시 1이 됨.
        let column_arr = [0,1,2];       //3열이든 , 4열이든, 가장 마지막 열이 가장 앞에 올때 딱 안 돌아가는 ..CSS transition 이 실행안되는 문제발생
        column_arr = shuffle(column_arr);       //[2,1,0] 일땐 계속 마지막 세번째 롤이 안 돌아가고 바로 결과값 나오는 문제가 발생함
        
        let first_wait_flag = true;        
        for (let i = 0; i < column_arr.length; i++) {
            if (first_wait_flag) {                
                first_wait_flag = false;
                await new Promise((resolve) => {                
                    setTimeout(resolve, 10);                    
                });    //초기 기다림-> 이유: 여기 await가 없으면 가장 첫 boxes가 가장 마지막 div일때, 돌아가지 않고 바로 결과카드가 나와버리는 오류 발생
            }            
            // 이상한게 가장 먼저 돌아가는 박스가 가장 마지막 열일때만 발생함. 3열이든, 5열이든...
            const door = doors.item(column_arr[i]);            
            const boxes = door.querySelector(".boxes");                        
            // const duration = parseInt(boxes.style.transitionDuration);      //굳이 div의 속성 duration 가져올 필요없음.
            
            boxes.style.transform = "translateY(0)";        //아래 init에서, 이미 카드가 한껏 회전되어 있는걸 이제 원래 자리로 돌린다고 생각하면 됨
            //await 는 async펑션내에서만 사용할 수 있으며, Promise나 어떤 value를 기다리는데 사용. async함수 내에서 마치 동기식처럼 작동하게 만들어줌
            await new Promise((resolve) => {      //setTimeout도 설정된 타이머의 id를 반환한다. ( 그게 promise의 result값이 되겠지 )
                setTimeout(resolve, 400);       //각각의 롤 시작 타임 간격. 한개의 카드열 롤링시작시간과 다음 열의 롤링 시작 사이 텀
            });            
        }        
    }
    let spin_over_count = 0;
    function init(firstInit = true, groups = 1, duration = 1) {     //groups는 items를 몇 세트 집어넣을지 정함
        let rolling_time_arr = [1, 2, 4];      //열이 3개라 각각의 롤링 타임을 하드코딩함
        rolling_time_arr = shuffle(rolling_time_arr);
        let rolling_time_arr2 = [...rolling_time_arr];
        let time_arr_sum = rolling_time_arr.reduce(function add(sum, currValue) {
            return sum + currValue;
          }, 0);        
        for (const door of doors) {       //door 는 개별 1개의 열. 즉 총 3번 반복될 코드
            if (firstInit) {        //완전한 초기화 라면
                //html 에서 태그 속에 " data-spinned " 속성이 생기고 값을 지정함. spinned = 0 은 아직 한번도 안 돈 것
                door.dataset.spinned = "0";       //따라서 완전한 초기화시에는 해당 속성 값을 0으로 만듬
            } else if (door.dataset.spinned === "1") {      // firstInit 값이 true가 아니면서, spinned 가 1이라면(돌아갔었다면)
                return;       // init() 메소드 종료. 이유: spin 눌러서 카드 돌아갈때(spinned=1) spin 또 누르는 경우에, 돌아가는걸 중지시키고 새로 돌려버리면
                            // 안되니까 return해서 init(), 즉 카드 초기화를 중지시키는 것
            }
    
            const boxes = door.querySelector(".boxes");     //door div안에 이는 boxes div . 1개밖에 없는 것으로 봐야.
            const boxesClone = boxes.cloneNode(false);      //node를 복사하되, parameter로 false라 하위 포함 노드는 미포함(텍스트도 복사x)
            //따라서 복사한건 <div class="boxes"></div>
    
            const pool = ["❓"];        //유저에게 처음 보여야 할 셀 카드
            if (!firstInit) {       //완전한 초기화 아니라면
                const arr = [];
                //   for (let n = 0; n < (groups > 0 ? groups : 1); n++) {     //groups를 양수로 지정시, 1이 되어, n은 딱 1번 반복된다.
                var repeat_count = rolling_time_arr.pop();          
                for (let n = 0; n < repeat_count; n++) {     //groups를 양수로 지정시, 1이 되어, n은 딱 1번 반복된다.
                    arr.push(...items);     //변수 arr에 items(모든 종류 카드모음)전체를 1번 집어넣음
                }
                pool.push(...shuffle(arr));       //기존 pool에 물음표를 가진 채로, 뒤에 items를 섞어서 추가함.
        
                boxesClone.addEventListener(      //매개변수 : 이벤트타입(문자열), 리스너, 옵션(once 가 true라서 한번 작동후 리스너 자동으로 제거됨)
                    "transitionstart",      //css Transition start event
                    function () {
                    door.dataset.spinned = "1";       //CSS전환이 시작되면, 한개의 div .door에 data-spinned 를 1로 만듬
                    this.querySelectorAll(".my_rotary_box").forEach((box) => {      //여기서 this는 아마 boxesClone일 듯
                        box.style.filter = "blur(1px)";         //안에 모든 box 클래스의 div들에게 css filter blur를 먹임
                    });
                    },
                    { once: true }
                );
        
                boxesClone.addEventListener(
                    "transitionend",        //CSS Transition 끝날때 리스너
                    function () {
                        //forEach((element, index, array) => { ... } ) box가 element, index(option)까지 만들었네
                        this.querySelectorAll(".my_rotary_box").forEach((box, index) => {       
                            box.style.filter = "blur(0)";       //blur를 없애고( 다시 명확하게 보이게 하고 )
                            if (index > 0) this.removeChild(box);   //boxesClone이 가지고 있는 첫번째 박스가 아닌 하위 모든 박스들은 없앤다.
                            //화면에 보이는 카드만 남기고, 다른 카드 목록을 없애버리는 것. 항상 화면에 보이는 카드 바로 옆에 ? 기본 카드가 있음
                            //removeChild시 없앤 노드를 반환하므로 변수에 담아놨다 활용가능. DOM에선 없어지지만, 변수에 담아놨으면 메모리엔 살아있음
                            //단, 여기같이 변수에 할당안하면 GC가 임의로 메모리에서 삭제함
                            spin_over_count++;
                            if (spin_over_count == 3+(items.length*time_arr_sum)) {        //처음 ?카드 3개 + items세트(11)* 7세트 = 80개가 됨
                                //룰렛 돌리기 완료시 설정해야 하는 동작 여기에 코딩
                                if (numberCondition % 2 == 0) {     // rotary 성공 시
                                    isLotteryWon = true;
                                    $('#rotaryModal').find(".modal-body").append(`
                                    <h2 class="h4 modal-title my-2 text-center">${my_custom_vars.rotaryRelatedString[5]}</h2>
                                    `); //모달 내부에 당첨 성공 메시지 표시
                                }else{          //rotary 실패 시
                                    $('#rotaryModal').find(".modal-body").append(`
                                    <h2 class="h4 modal-title my-2 text-center">${my_custom_vars.rotaryRelatedString[4]}</h2>
                                    `); //모달 내부에 당첨 꽝 메시지 표시
                                }
                                $('#spinner').replaceWith(`
                                <button class="btn btn-facebook" type="button" id="btn_complete_rotary" style="font-weight: bold;">
                                    <span class="mr-1">
                                        <span class="text-success mr-1"><span class="fas fa-check-circle"></span>
                                    </span> Ok
                                </button>
                                `);     //모달 닫기 위해 ok 버튼 으로 교체
                                $(`#btn_complete_rotary`).on('click', function() {$(`#rotaryModal`).modal('hide');});
                                $(`#rotaryModal`).on('hide.bs.modal', function (e) {     //모달 ok 누르면
                                    showLoading();
                                    updateRecentWritingTimeAndMoveToCardUI(global_written_timestamp);              // 모달 ok 클릭시 cardUI로 이동
                                });
                            }
                        });
                    },
                    { once: true }      //이 역시 딱 한번만 리스너 실행 후 제거
                );
            }          
            
            //만들어진 pool( 초기표시카드 ? 와 셔플된 카드들이 들어있는 )의 마지막 인덱스부터 0까지 반복, ( 길이가 4인 배열이라면 3,2,1,0(끝) 이런 식)
            for (let i = pool.length - 1; i >= 0; i--) {        
                const box = document.createElement("div");    //boxesClone의 자식으로 넣어줄 div .box를 만듬.
                box.classList.add("my_rotary_box");
                // box.style.width = door.clientWidth + "px";        //clientWidth, height 는 패딩포함한 내부 px 길이
                // box.style.height = door.clientHeight + "px";      //상위 div인 .door div의 가로,세로를 가짐. 이상하게 0으로 나와서 직접 코딩함
                box.style.width = 100 + "px";        //clientWidth, height 는 패딩포함한 내부 px 길이
                box.style.height = 150 + "px";      //상위 div인 .door div의 가로,세로를 가짐. 이상하게 0으로 나와서 직접 코딩함
                //node의 텍스트 내용을 pool[i], 즉 가장 배열의 뒷 부분 아이템 부터 채움. 따라서 가장 마지막에 ?인 초기화 카드가 들어가게 됨
                box.textContent = pool[i];            
                boxesClone.appendChild(box);          //아직 DOM에 추가하지 않은 boxesClone 하위 노드로 box를 추가
            }
            // boxesClone.style.transitionDuration = `${duration > 0 ? duration : 1}s`;        //CSS 변환시간을 기본값 1로 만들어 놓음
            //임의로 돌아가는 시간 만들어 놓은 코드
            boxesClone.style.transitionDuration = `${rolling_time_arr2.pop()}s`;        
            boxesClone.style.transform = `translateY(-${        //css에서 transform:translateY(임의값 px) 넣는 것과 마찬가지
                //상위 div인 .door div의 높이 * pool길이보다 1작은 수 함으로서 원래 ? 라면, 그 바로 위나 아래의 카드로 결국 이동하게 만드네.
                // door.clientHeight * (pool.length - 1)           //초기에 pool.length는 1이지. 따라서 firstInit이 true일땐, pool배열엔 ? 하나만 들어가있음
                150 * (pool.length - 1)           //초기에 pool.length는 1이지. 따라서 firstInit이 true일땐, pool배열엔 ? 하나만 들어가있음
                //pool.length가 엄청 길어지는건 firstInit이 false상태로 init() 실행 시 임. 
            }px)`;        
            door.replaceChild(boxesClone, boxes);       //parentNode.replaceChild(newChild, oldChild);
        }
        if (numberCondition % 2 == 0) {     // rotary 성공화면 나와야
            // div 구조 : boxes 클래스의 div 한개 아래 my_rotary_box 클래스의 div가 여러개 있고, 개별 my_rotary_box div들은
            // 안에 text 로 아이스크림이모지, 깃발이모지 등의 문자를 딱 1개씩 텍스트값으로 가지고 있음.
            // 그리고 위에서 shuffle하고 난 구조는 [ 최종적으로 보일 이모지, 이모지2, 이모지3... 마지막원소로 ?(롤링시작전보이는물음표)]
            // 이므로, 롤링 시작하면, boxes div가 아래부분보이다가 쭉 윗부분으로 보이는 화면이 넘어가는 구조임. 항상 index 0의
            // my_rotary_box div 가 가진 이모지가 최종결과로 보이게 되는 것.
            let emoji = $('.door').eq(0).find('.my_rotary_box').eq(0).text();
            $('.door').eq(1).find('.my_rotary_box').eq(0).text(emoji);
            $('.door').eq(2).find('.my_rotary_box').eq(0).text(emoji);
        }else{              //rotary 실패 화면 나와야
            let emoji = $('.door').eq(0).find('.my_rotary_box').eq(0).text();
            if ($('.door').eq(2).find('.my_rotary_box').eq(0).text()==emoji) {      //1열, 3열 값이 같다면
                if(items.indexOf(emoji)==0){        //가장 첫번째 문자라면 마지막 문자를 3열에 넣어줌
                    $('.door').eq(2).find('.my_rotary_box').eq(0).text(items[items.length-1]);
                }else{          //첫번째 문자가 아닌 모든 경우엔 그냥 바로 전 문자를 넣어줌
                    $('.door').eq(2).find('.my_rotary_box').eq(0).text(items[items.indexOf(emoji)-1]);
                }
            }            
        }
    }
  
    //즉, 페이지 첫로딩했거나, 초기화 버튼 눌렀을 때는 shuffle이 실행된적 없고 pool배열엔 ? 하나뿐임. spin시 비로소 firstInit이 false로 들어가고 실행함
    function shuffle([...arr]) {    //받은 배열을 뒤섞어서 새 배열을 리턴함. 넣었던 매개변수의 원배열은 그대로 유지함
      let m = arr.length;
      while (m) {
        //math.floor 는 버림 메소드(5.95 -> 5)
        // 0<= x < 1  => 0< 4x < 4  floor하면 나올수 있는 것 : 0, 1, 2, 3 (처음 넣는 m값만큼의 0부터 포함한 정수 개수)
        const i = Math.floor(Math.random() * m--);      //여기서 m이 1빠졌으므로 indexOutOfRange는 발생하지 않음
        //arr 배열 내에서 순서를 바꿈 ( 참조값들이라 이런 식의 선언으로 실행가능한 듯)
        [arr[m], arr[i]] = [arr[i], arr[m]];        
      }
      return arr;
    }  
    init();    
}

//rotaryMethod() 의 수정전 백업용
// function rotaryMethod2() {
//     "use strict";       //좀더 silent한 오류를 예외를 던지게 만들고, 몇가지 추가될 수 있는 문법사용을 금지시킴. 좀 빨라질 수 있음.
  
//     const items = [     //총 12개
//       "🍭",
//       "❌",
//       "⛄️",
//       "🦄",
//       "🍌",
//       "💩",
//       "👻",
//       "😻",
//       "💵",
//       "🤡",
//       "🦖",
//       "🍎"
//     ];
      
//     const doors = document.querySelectorAll(".door");       // 총 3개의 열을 리스트로 bind
//     document.querySelector("#spinner").addEventListener("click", spin);
      
//     async function spin() {
//         $('#spinner').css('visibility','hidden');       //spin 버튼 숨김
        
//         //firstInit이 false, 즉 card를 셔플해서 비로소 pool에 집어넣고
//         init(false, 1, 2);            //groups는 1이니, items는 1세트 집어넣고, duration은 2이므로, 다시 1이 됨.
//         let column_arr = [0,1,2];       //3열이든 , 4열이든, 가장 마지막 열이 가장 앞에 올때 딱 안 돌아가는 ..CSS transition 이 실행안되는 문제발생
//         column_arr = shuffle(column_arr);       //[2,1,0] 일땐 계속 마지막 세번째 롤이 안 돌아가고 바로 결과값 나오는 문제가 발생함
        
//         let first_wait_flag = true;
//         for (let i = 0; i < column_arr.length; i++) {
//             if (first_wait_flag) {
//                 first_wait_flag = false;
//                 await new Promise((resolve) => {
//                     setTimeout(resolve, 10);
//                 });    //초기 기다림-> 이유: 여기 await가 없으면 가장 첫 boxes가 가장 마지막 div일때, 돌아가지 않고 바로 결과카드가 나와버리는 오류 발생
//             }
//             // 이상한게 가장 먼저 돌아가는 박스가 가장 마지막 열일때만 발생함. 3열이든, 5열이든...
//             const door = doors.item(column_arr[i]);
//             const boxes = door.querySelector(".boxes");
//             // const duration = parseInt(boxes.style.transitionDuration);      //굳이 div의 속성 duration 가져올 필요없음.
            
//             boxes.style.transform = "translateY(0)";        //아래 init에서, 이미 카드가 한껏 회전되어 있는걸 이제 원래 자리로 돌린다고 생각하면 됨
//             //await 는 async펑션내에서만 사용할 수 있으며, Promise나 어떤 value를 기다리는데 사용. async함수 내에서 마치 동기식처럼 작동하게 만들어줌
//             await new Promise((resolve) => {      //setTimeout도 설정된 타이머의 id를 반환한다. ( 그게 promise의 result값이 되겠지 )
//                 setTimeout(resolve, 400);       //각각의 롤 시작 타임 간격. 한개의 카드열 롤링시작시간과 다음 열의 롤링 시작 사이 텀
//             });
//         }
//     }
//     let spin_over_count = 0;
//     function init(firstInit = true, groups = 1, duration = 1) {     //groups는 items를 몇 세트 집어넣을지 정함
//         let rolling_time_arr = [1, 2, 4];      //열이 3개라 각각의 롤링 타임을 하드코딩함
//         rolling_time_arr = shuffle(rolling_time_arr);
//         let rolling_time_arr2 = [...rolling_time_arr];
//         let time_arr_sum = rolling_time_arr.reduce(function add(sum, currValue) {
//             return sum + currValue;
//           }, 0);
//         for (const door of doors) {       //door 는 개별 1개의 열. 즉 총 3번 반복될 코드
//             if (firstInit) {        //완전한 초기화 라면
//                 //html 에서 태그 속에 " data-spinned " 속성이 생기고 값을 지정함. spinned = 0 은 아직 한번도 안 돈 것
//             door.dataset.spinned = "0";       //따라서 완전한 초기화시에는 해당 속성 값을 0으로 만듬
//             } else if (door.dataset.spinned === "1") {      // firstInit 값이 true가 아니면서, spinned 가 1이라면(돌아갔었다면)
//             return;       // init() 메소드 종료. 이유: spin 눌러서 카드 돌아갈때(spinned=1) spin 또 누르는 경우에, 돌아가는걸 중지시키고 새로 돌려버리면
//                             // 안되니까 return해서 init(), 즉 카드 초기화를 중지시키는 것
//             }
    
//             const boxes = door.querySelector(".boxes");     //door div안에 이는 boxes div . 1개밖에 없는 것으로 봐야.
//             const boxesClone = boxes.cloneNode(false);      //node를 복사하되, parameter로 false라 하위 포함 노드는 미포함(텍스트도 복사x)
//             //따라서 복사한건 <div class="boxes"></div>
    
//             const pool = ["❓"];        //유저에게 처음 보여야 할 셀 카드
//             if (!firstInit) {       //완전한 초기화 아니라면
//                 const arr = [];
//                 //   for (let n = 0; n < (groups > 0 ? groups : 1); n++) {     //groups를 양수로 지정시, 1이 되어, n은 딱 1번 반복된다.
//                 var repeat_count = rolling_time_arr.pop();
//                 for (let n = 0; n < repeat_count; n++) {     //groups를 양수로 지정시, 1이 되어, n은 딱 1번 반복된다.
//                     arr.push(...items);     //변수 arr에 items(모든 종류 카드모음)전체를 1번 집어넣음
//                 }
//                 pool.push(...shuffle(arr));       //기존 pool에 물음표를 가진 채로, 뒤에 items를 섞어서 추가함.
        
//                 boxesClone.addEventListener(      //매개변수 : 이벤트타입(문자열), 리스너, 옵션(once 가 true라서 한번 작동후 리스너 자동으로 제거됨)
//                     "transitionstart",      //css Transition start event
//                     function () {
//                     door.dataset.spinned = "1";       //CSS전환이 시작되면, 한개의 div .door에 data-spinned 를 1로 만듬
//                     this.querySelectorAll(".my_rotary_box").forEach((box) => {      //여기서 this는 아마 boxesClone일 듯
//                         box.style.filter = "blur(1px)";         //안에 모든 box 클래스의 div들에게 css filter blur를 먹임
//                     });
//                     },
//                     { once: true }
//                 );
        
//                 boxesClone.addEventListener(
//                     "transitionend",        //CSS Transition 끝날때 리스너
//                     function () {
//                         //forEach((element, index, array) => { ... } ) box가 element, index(option)까지 만들었네
//                         this.querySelectorAll(".my_rotary_box").forEach((box, index) => {
//                         box.style.filter = "blur(0)";       //blur를 없애고( 다시 명확하게 보이게 하고 )
//                         if (index > 0) this.removeChild(box);   //boxesClone이 가지고 있는 첫번째 박스가 아닌 하위 모든 박스들은 없앤다.
//                         //화면에 보이는 카드만 남기고, 다른 카드 목록을 없애버리는 것. 항상 화면에 보이는 카드 바로 옆에 ? 기본 카드가 있음
//                         //removeChild시 없앤 노드를 반환하므로 변수에 담아놨다 활용가능. DOM에선 없어지지만, 변수에 담아놨으면 메모리엔 살아있음
//                         //단, 여기같이 변수에 할당안하면 GC가 임의로 메모리에서 삭제함
//                         spin_over_count++;
//                         if (spin_over_count == 3+(items.length*time_arr_sum)) {        //처음 ?카드 3개 + items세트(12)* 7세트 = 87개가 됨
//                             //룰렛 돌리기 완료시 설정해야 하는 동작 여기에 코딩
//                             $('#rotaryModal').find(".modal-body").append(`
//                             <h2 class="h4 modal-title my-2 text-center">${my_custom_vars.rotaryRelatedString[4]}</h2>
//                             `); //모달 내부에 당첨 꽝 메시지 표시
//                             $('#spinner').replaceWith(`
//                             <button class="btn btn-facebook" type="button" id="btn_complete_rotary" style="font-weight: bold;">
//                                 <span class="mr-1">
//                                     <span class="text-success mr-1"><span class="fas fa-check-circle"></span>
//                                 </span> Ok
//                             </button>
//                             `);     //모달 닫기 위해 ok 버튼 으로 교체
//                             $(`#btn_complete_rotary`).on('click', function() {$(`#rotaryModal`).modal('hide');});
//                             $(`#rotaryModal`).on('hide.bs.modal', function (e) {     //모달 ok 누르면
//                                 showLoading();
//                                 updateRecentWritingTimeAndMoveToCardUI(global_written_timestamp);              // 모달 ok 클릭시 cardUI로 이동
//                             });
//                         }
//                     });
//                     },
//                     { once: true }      //이 역시 딱 한번만 리스너 실행 후 제거
//                 );
//             }
            
//             //만들어진 pool( 초기표시카드 ? 와 셔플된 카드들이 들어있는 )의 마지막 인덱스부터 0까지 반복, ( 길이가 4인 배열이라면 3,2,1,0(끝) 이런 식)
//             for (let i = pool.length - 1; i >= 0; i--) {
//                 const box = document.createElement("div");    //boxesClone의 자식으로 넣어줄 div .box를 만듬.
//                 box.classList.add("my_rotary_box");
//                 // box.style.width = door.clientWidth + "px";        //clientWidth, height 는 패딩포함한 내부 px 길이
//                 // box.style.height = door.clientHeight + "px";      //상위 div인 .door div의 가로,세로를 가짐. 이상하게 0으로 나와서 직접 코딩함
//                 box.style.width = 100 + "px";        //clientWidth, height 는 패딩포함한 내부 px 길이
//                 box.style.height = 150 + "px";      //상위 div인 .door div의 가로,세로를 가짐. 이상하게 0으로 나와서 직접 코딩함
//                 //node의 텍스트 내용을 pool[i], 즉 가장 배열의 뒷 부분 아이템 부터 채움. 따라서 가장 마지막에 ?인 초기화 카드가 들어가게 됨
//                 box.textContent = pool[i];
//                 boxesClone.appendChild(box);          //아직 DOM에 추가하지 않은 boxesClone 하위 노드로 box를 추가
//             }
//             // boxesClone.style.transitionDuration = `${duration > 0 ? duration : 1}s`;        //CSS 변환시간을 기본값 1로 만들어 놓음
//             //임의로 돌아가는 시간 만들어 놓은 코드
//             boxesClone.style.transitionDuration = `${rolling_time_arr2.pop()}s`;
//             boxesClone.style.transform = `translateY(-${        //css에서 transform:translateY(임의값 px) 넣는 것과 마찬가지
//                 //상위 div인 .door div의 높이 * pool길이보다 1작은 수 함으로서 원래 ? 라면, 그 바로 위나 아래의 카드로 결국 이동하게 만드네.
//                 // door.clientHeight * (pool.length - 1)           //초기에 pool.length는 1이지. 따라서 firstInit이 true일땐, pool배열엔 ? 하나만 들어가있음
//                 150 * (pool.length - 1)           //초기에 pool.length는 1이지. 따라서 firstInit이 true일땐, pool배열엔 ? 하나만 들어가있음
//                 //pool.length가 엄청 길어지는건 firstInit이 false상태로 init() 실행 시 임.
//             }px)`;
//             door.replaceChild(boxesClone, boxes);       //parentNode.replaceChild(newChild, oldChild);
//         }
//     }
  
//     //즉, 페이지 첫로딩했거나, 초기화 버튼 눌렀을 때는 shuffle이 실행된적 없고 pool배열엔 ? 하나뿐임. spin시 비로소 firstInit이 false로 들어가고 실행함
//     function shuffle([...arr]) {    //받은 배열을 뒤섞어서 새 배열을 리턴함. 넣었던 매개변수의 원배열은 그대로 유지함
//       let m = arr.length;
//       while (m) {
//         //math.floor 는 버림 메소드(5.95 -> 5)
//         // 0<= x < 1  => 0< 4x < 4  floor하면 나올수 있는 것 : 0, 1, 2, 3 (처음 넣는 m값만큼의 0부터 포함한 정수 개수)
//         const i = Math.floor(Math.random() * m--);      //여기서 m이 1빠졌으므로 indexOutOfRange는 발생하지 않음
//         //arr 배열 내에서 순서를 바꿈 ( 참조값들이라 이런 식의 선언으로 실행가능한 듯)
//         [arr[m], arr[i]] = [arr[i], arr[m]];
//       }
//       return arr;
//     }
//     init();
// }

//Rotary 애니메이션 올릴 모달
function returnRotaryTagString() {
    let tagString = `
    <div class="modal fade" data-backdrop="static" id="rotaryModal" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content shadow-soft">
                <div class="modal-header mx-auto mt-3">
                    <span class="lead mb-0 h4">${my_custom_vars.rotaryRelatedString[2]}</span>                        
                </div>
                <div class="modal-body">
                    <div class="py-3 text-center">
                        <!-- rotary app 부분 -->
                        <div id="rotary_app">
                            <div class="doors">
                                <div class="door">
                                    <div class="boxes">
                                    <!-- <div class="my_rotary_box">?</div> -->
                                    </div>
                                </div>
                            
                                <div class="door">
                                    <div class="boxes">
                                    <!-- <div class="my_rotary_box">?</div> -->
                                    </div>
                                </div>
                            
                                <div class="door">
                                    <div class="boxes">
                                    <!-- <div class="my_rotary_box">?</div> -->
                                    </div>
                                </div>          
                            </div>
                        </div>
                        <!-- rotary app 부분 여기까지-->
                    </div>
                </div>  
                <div class="modal-footer justify-content-center">                    
                    <button class="btn btn-facebook" type="button" id="spinner" style="font-weight: bold;">
                        <span class="mr-1">
                            <span class="text-success mr-1"><span class="fas fa-check-circle"></span></span> ${my_custom_vars.rotaryRelatedString[3]}
                    </button>
                </div>              
            </div>
        </div>
    </div>
    `;
    return tagString;
}
function returnThisWeekLotteryOverTagString() {
    let tagString = `
    <div class="modal fade" data-backdrop="static" id="modal_thisWeekLotteryOver" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content shadow-soft">
                <div class="modal-header mx-auto mt-3">
                    <span class="lead mb-0 h4">${my_custom_vars.rotaryRelatedString[2]}</span>                        
                </div>
                <div class="modal-body">
                    <div class="py-3 text-center">                        
                        <h2 class="h4 modal-title my-2">${my_custom_vars.rotaryRelatedString[0]}</h2>
                        <p>${my_custom_vars.rotaryRelatedString[1]}</p>                        
                    </div>
                </div>  
                <div class="modal-footer">
                    <button type="button" class="btn btn-sm btn-primary" id="modal_thisWeekLotteryOver_close_btn">OK</button>
                </div>              
            </div>
        </div>
    </div>    
    `;
    return tagString;
}
// 끝나면 writingRecord 수정하고, cardUI로 이동하는 메소드
function updateRecentWritingTimeAndMoveToCardUI(just_written_timestamp) {        
    db.collection("writingRecord").doc(firebase.auth().currentUser.uid).set({timestamps : just_written_timestamp}, {merge:true}).then(()=>{
        if (isLotteryWon) {     //Rotary 성공시
            db.collection('goldenTicketImages').doc(firebase.auth().currentUser.uid).set({
                uid : firebase.auth().currentUser.uid,
                docid : created_doc_id,         //막 작성한 문서의 id를 필드에 넣음
                classIndex : my_custom_vars.classNameList.indexOf(usersInfoMap.get(firebase.auth().currentUser.uid).relation)
            }).then(()=>{
                hideLoading();
                window.location.href = '/list_cardUI.html';
            }).catch(error =>{
                hideLoading();
                my_custom_vars.showSwalErrorMessage_db(error);
            });
        }else{      //Rotary 실패시
            hideLoading();
            window.location.href = '/list_cardUI.html';
        }        
    }).catch(error2 => {
        hideLoading();
        my_custom_vars.showSwalErrorMessage_db(error2);
    });
}
function rouletteLuck(just_written_timestamp) {
    if (evenOnceWonPersonListMyClass.length >= calculateThisWeekNumberth(just_written_timestamp)) {        
        //이미 이번 주 당첨자가 나왔을 때는 노티해줌. "이번 주의 골든티켓 추첨이 끝났습니다. 다음 주 행운을 빕니다~ 등 문구 "
        $('#div_badge_modal_here').append(`${returnThisWeekLotteryOverTagString()}`);
        $(`#modal_thisWeekLotteryOver`).modal({keyboard:false});        //esc로 탈출 금지 모달
        $(`#modal_thisWeekLotteryOver_close_btn`).on('click', function() {$(`#modal_thisWeekLotteryOver`).modal('hide');});
        $(`#modal_thisWeekLotteryOver`).on('hide.bs.modal', function (e) {     //모달 ok 누르면
            showLoading();
            updateRecentWritingTimeAndMoveToCardUI(just_written_timestamp);              // 모달 ok 클릭시 cardUI로 이동
        });        
    }else{          //아직 이번주나 저번주의 당첨자가 안나와서, 당첨자 TO가 남았을 때
        if (just_written_timestamp - my_prev_writing_record >= my_custom_vars.rotaryWritingArticleLeastTimeLimit) {       
            //과거 글 쓴 시간에서 1시간은 지났을 때, 360만 밀리초
            if (evenOnceWonPersonListMyClass.includes(firebase.auth().currentUser.uid)) {     //이미 당첨기록이 있으면
                // 이미 당첨기록이 있다 하더라도 룰렛 모달은 띄워주기로 함 ( 100% 실패임을 알려주지 않음 )
                //슬롯 돌리는 모달 띄우고, 돌리게 만듬.
                $('#div_badge_modal_here').append(`${returnRotaryTagString()}`);
                rotaryMethod(1);     //로타리 초기화 시키는 메소드. 홀수 실패. 짝수는 성공시
                $(`#rotaryModal`).modal({keyboard:false});        //esc로 탈출 금지 모달 띄움
                //여기 spinner 버튼 누른 담에 spin 이 끝나면 어떻게 할 것인지는 boxesClone의 트랜지션end리스너에 정의함
                // 여기 애니메이션은 실패 애니메이션이 필요. 모달 닫히면 cardUI로 이동
            }else{      //아직 당첨자 목록에 지금 유저가 없으면. ( 즉, 여기 왔다는건, 이번주 당첨자TO도 있고, 급하게 중복 글 쓴것도 아닐 때)
                let classNameIndex = my_custom_vars.classNameList.indexOf(usersInfoMap.get(firebase.auth().currentUser.uid).relation);
                //classNameIndex 타입은 number, rotary콜렉션에서 문서명을 의미함 ( 0, 1, 2...)
                db.collection("rotary").doc(String(classNameIndex)).update({        //doc 이름으로 쓸 때는 String() 해줘야
                    wonPersonList: firebase.firestore.FieldValue.arrayUnion(firebase.auth().currentUser.uid),
                    weekNumberth: calculateThisWeekNumberth(just_written_timestamp),
                    index: classNameIndex
                }).then(()=>{       // 당첨 되었을 때. ( 랜덤 요소 충족했을 때 )
                    //슬롯 돌리는 모달 띄우고, 돌리게 만듬.
                    $('#div_badge_modal_here').append(`${returnRotaryTagString()}`);
                    $(`#rotaryModal`).modal({keyboard:false});        //esc로 탈출 금지 모달
                    rotaryMethod(2);     //로타리 초기화 시키는 메소드
                    // 여기 애니메이션은 성공 애니메이션이 필요
                    //여기 spinner 버튼 누른 담에 spin 이 끝나면 어떻게 할 것인지는 boxesClone의 트랜지션end리스너에 정의함
                }).catch(error => {                    
                    //rotary 콜렉션을 update 못 했다는 것은 => 랜덤특정시간 충족 못한 것. 그냥 꽝임( 그 외 불가 조건은 위에서 걸렀음)
                    //실제론 보안규칙에서도 모든 3가지 조건 거르고 있음
                    //  1.현유저당첨전적없음 2.특정랜덤시간글작성 3.해당주당첨자가 그 반에 없음
                    
                    //슬롯 돌리는 모달 띄우고, 돌리게 만듬.
                    $('#div_badge_modal_here').append(`${returnRotaryTagString()}`);
                    rotaryMethod(3);     //로타리 초기화 시키는 메소드
                    $(`#rotaryModal`).modal({keyboard:false});        //esc로 탈출 금지 모달 띄움
                    //여기 spinner 버튼 누른 담에 spin 이 끝나면 어떻게 할 것인지는 boxesClone의 트랜지션end리스너에 정의함
                    // 여기 애니메이션은 실패 애니메이션이 필요. 모달 닫히면 cardUI로 이동
                });
            }            
        }else{      // 과거 글 쓴지 1시간이 지나지 않았다면
            updateRecentWritingTimeAndMoveToCardUI(just_written_timestamp);     // 당첨권 돌리려고 글 쓴 것이므로, 노티 없이 cardUI로 이동
        }        
    }
}

var modalCheckObject = {
    modalOpenedCount : 0,       //혹 배지 조건 충족해서 모달 열리면 ++
    onlyOnceRun : true,          // 배지 조건 체크는 딱 한번만 실행하기 위한 변수
    myArticleCount : 0         // 현재 유저가 쓴 글 수
};
var sendDataBadgeObj = {};      //배지 획득해서 usersInfo 업데이트시 보내는 data

var postingArray = [];          //자기 글만 담겨 있음(timestamp -desc 순)
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
                    prepareDBdataForRoullete();

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
                        my_custom_vars.changeIconIfExistRecentNotice();        //신규 공지사항 확인 후 icon 교체
                    });
                }
            );
        }        
    ).catch(error => {
        my_custom_vars.showSwalErrorMessage_db(error);        
    });
}

var created_doc_id;
var global_written_timestamp;       //rotary돌리고 나서 writingRecord갱신 위해서 글로벌 변수로 만들어 놓음
//이미지 다중 선택 및 순서 변경 코드 with Jquery UI
//jQuery(document).ready 도 $(document).ready() 와 동일하다고 봐야
jQuery(document).ready(function() {                   
    var storedFiles = [];         
   
    // Apply sort function . 실행 되고 있는 타이밍 : 그림 순서 바꿨을때, 그림 삭제했을때, 순서안바꾸고 그대로 올릴경우 업로드 시, 그림 첨 선택했을 때 <= 이건 내가 추가
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
                        //아래 섬네일 부분
                        $('.cvf_uploaded_files').append(
                            "<li file = '" + file.name + "'>" +                                
                                "<img title = 'Drag to reorder' class = 'img-thumb' src = '" + e.target.result + "' />" +
                                "<a href = '#' class = 'cvf_delete_image' title = 'Delete'><img class = 'delete-btn' src = '/img/delete-btn.png' /></a>" +
                            "</li>"
                        );
                        // 위에 큰 이미지 부분
                        $('#div_carousel-inner').append(`           
                            <div class="carousel-item" style="height:630px;">
                                <img class="d-block" style="margin: auto; position: absolute; top: 0; left: 0; right: 0; bottom: 0;" src="${e.target.result}" alt="" file="${file.name}">
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
                    $('#div_reorder_guide_message').css('display', 'block');
                }
                $('#p_picture_count').text(`picture count : ${storedFiles.length}`);
                setTimeout(function(){
                    cvf_add_order();
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

        showLoading();              //로딩 이미지 띄움.
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
        // Storage에 저장될 파일 이름 미리 배열에 준비
        var now = new Date().yyyyMMdd_HHmmss()+'';
        for (let index = 0; index < ordered_file_arr.length; index++) {                                   
            ordered_created_filename_arr.push(`JPEG_${now}${index}_.png`);
        }
        //모든 파일이 Storage 저장 됐는지 확인후 DB 세팅하는 메소드
        function setDBInfo_after_upload_completion() {
            if (upload_complete_files_url.includes('empty')) return;
            var data = new my_custom_vars.ContentDTO();
            // 여기 title이랑, explain 은 앞뒤 trim 하고 나서 올림
            data.title = ($('#title_article').val()).toString().trim();
            data.explain = ($('#content_article').val()).toString().trim();
            data.imageArr = upload_complete_files_url;            
            data.imageFileName = (upload_complete_files_url[0].substr(upload_complete_files_url[0].indexOf('JPEG'), upload_complete_files_url[0].length)).split('_.png')[0]+'_.png';
            data.imageUrl = upload_complete_files_url[0];
            data.timestamp = new Date().getTime();      //timestamp 는 db 업뎃 시간 기준
            global_written_timestamp = data.timestamp;         
            data.uid = firebase.auth().currentUser?.uid;
            data.userId = firebase.auth().currentUser?.email;
            //videoUrl, youtubeId는 기본값이 ""  ( not undefined )
                        
            const docRef = db.collection("images").doc();
            created_doc_id = docRef.id;
            db.collection("images").doc(created_doc_id).withConverter(my_custom_vars.contentDTOConverter).set(data).then(()=>{
                //db 업데이트 성공시     /*  푸시 보내는 코드... 는, 유나 일기는 만들되, 영어 일기에선 생략   */
                hideLoading();

                //LongWriter, MaxPhoto Badge 관련 코드
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
                function appendModalSetCloseListner(index){
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
                                rouletteLuck(data.timestamp);
                            }).catch(error2 => {
                                hideLoading();
                                my_custom_vars.showSwalErrorMessage_db(error2);
                            });                
                        }
                    });
                }
                function isLongWriterBadgeAccomplished(){
                    if(usersInfoMap.get(firebase.auth().currentUser.uid).isLongWriterEventTriggered){
                        return;
                    }
                    if (data.explain.length >= 1000) {
                        appendModalSetCloseListner(4);      //긴글 작성 LongWriter는 인덱스 4
                    }
                }                
                function isMaxPhotoUploadBadgeAccomplished() {      
                    if (usersInfoMap.get(firebase.auth().currentUser.uid).isMaxPhotoUploadEventTriggered) {                        
                        return;
                    }                    
                    if (upload_complete_files_url.length == 10) {      //배지 획득 조건 검토
                        appendModalSetCloseListner(5);      //사진 10장 배지는 인덱스 5
                    }                    
                }                                
                if (data.explain.length < 1000 && upload_complete_files_url.length < 10) {      //모든 배지 조건 안될 때
                    rouletteLuck(data.timestamp);                    
                }else{      //2개의 배지 중 뭐 하나의 조건이라도 충족되는 경우
                    isLongWriterBadgeAccomplished();
                    isMaxPhotoUploadBadgeAccomplished();
                }                
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
                hideLoading();
            },function(){
                //업로드 성공시 리스너
                uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL){
                    upload_complete_files_url[index] = downloadURL;
                    setDBInfo_after_upload_completion();
                });
            });
        }

        for (let i = 0; i < ordered_file_arr.length; i++) {
            saveFileSrcToStorageReceiveUrl(i, ordered_file_arr[i], ordered_created_filename_arr[i]);
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