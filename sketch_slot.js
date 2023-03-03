//즉시 실행 함수 (Immediately-invoked function expression)
// 형태    (function () { // statements })()
//한 번의 실행만 필요로 하는 초기화 코드 부분에 많이 사용됩니다.
//이유  :  변수를 전역(global scope)으로 선언하는 것을 피하기 위해서
(function () {
    "use strict";       //좀더 silent한 오류를 예외를 던지게 만들고, 몇가지 추가될 수 있는 문법사용을 금지시킴. 좀 빨라질 수 있음.
  
    const items = [     //총 12개
      "🍭",
      "❌",
      "⛄️",
      "🦄",
      "🍌",
      "💩",
      "👻",
      "😻",
      "💵",
      "🤡",
      "🦖",
      "🍎"
    ];
      
    const doors = document.querySelectorAll(".door");       // 총 3개의 열을 리스트로 bind
    document.querySelector("#spinner").addEventListener("click", spin);
    document.querySelector("#reseter").addEventListener("click", init);
      
    async function spin() {
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
      
    function init(firstInit = true, groups = 1, duration = 1) {     //groups는 items를 몇 세트 집어넣을지 정함
        let rolling_time_arr = [1, 2, 4];      //열이 3개라 각각의 롤링 타임을 하드코딩함
        rolling_time_arr = shuffle(rolling_time_arr);
        let rolling_time_arr2 = [...rolling_time_arr];
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
              });
            },
            { once: true }      //이 역시 딱 한번만 리스너 실행 후 제거
          );
        }          
        
        //만들어진 pool( 초기표시카드 ? 와 셔플된 카드들이 들어있는 )의 마지막 인덱스부터 0까지 반복, ( 길이가 4인 배열이라면 3,2,1,0(끝) 이런 식)
        for (let i = pool.length - 1; i >= 0; i--) {        
          const box = document.createElement("div");    //boxesClone의 자식으로 넣어줄 div .box를 만듬.
          box.classList.add("my_rotary_box");
          box.style.width = door.clientWidth + "px";        //clientWidth, height 는 패딩포함한 내부 px 길이
          box.style.height = door.clientHeight + "px";      //상위 div인 .door div의 가로,세로를 가짐
          //node의 텍스트 내용을 pool[i], 즉 가장 배열의 뒷 부분 아이템 부터 채움. 따라서 가장 마지막에 ?인 초기화 카드가 들어가게 됨
          box.textContent = pool[i];            
          boxesClone.appendChild(box);          //아직 DOM에 추가하지 않은 boxesClone 하위 노드로 box를 추가
        }
        // boxesClone.style.transitionDuration = `${duration > 0 ? duration : 1}s`;        //CSS 변환시간을 기본값 1로 만들어 놓음
        //임의로 돌아가는 시간 만들어 놓은 코드
        boxesClone.style.transitionDuration = `${rolling_time_arr2.pop()}s`;        
        boxesClone.style.transform = `translateY(-${        //css에서 transform:translateY(임의값 px) 넣는 것과 마찬가지
            //상위 div인 .door div의 높이 * pool길이보다 1작은 수 함으로서 원래 ? 라면, 그 바로 위나 아래의 카드로 결국 이동하게 만드네.
            door.clientHeight * (pool.length - 1)           //초기에 pool.length는 1이지. 따라서 firstInit이 true일땐, pool배열엔 ? 하나만 들어가있음
            //pool.length가 엄청 길어지는건 firstInit이 false상태로 init() 실행 시 임. 
        }px)`;        
        door.replaceChild(boxesClone, boxes);       //parentNode.replaceChild(newChild, oldChild);                   
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
  })();