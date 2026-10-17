# 📋 구글 스프레드시트 & Apps Script 연결 안내서 (setup.md)

초등학교 교실에서 구글 스프레드시트와 웹앱(체크판)을 안전하고 손쉽게 연결할 수 있도록 안내하는 가이드입니다.

---

## 1단계: 구글 스프레드시트 만들기

1. [구글 스프레드시트](https://sheets.new)에 접속하여 새 시트를 생성합니다.
2. 스프레드시트 제목을 예: `[3학년 2반] 가정통신문 회신서 제출 현황`으로 설정합니다.
3. **1행(헤더)**에 다음 열 이름을 순서대로 입력합니다.

| A열 (1) | B열 (2) | C열 (3) | D열 (4) |
| :---: | :---: | :---: | :---: |
| **번호** | **이름** | **제출여부** | **체크시간** |

4. **2행부터 11행**까지 가상 학생 10명의 초기 데이터를 입력합니다.
   - 번호: `1` ~ `10`
   - 이름: `가상01` ~ `가상10`
   - 제출여부: `미제출` (또는 빈칸)
   - 체크시간: (빈칸)

---

## 2단계: Google Apps Script (Code.gs) 작성하기

1. 시트 상단 메뉴에서 **[확장 프로그램] > [Apps Script]**를 클릭합니다.
2. 기존에 적혀 있는 코드를 모두 지우고, 아래의 **`Code.gs`** 코드를 그대로 붙여넣습니다.

```javascript
/**
 * 가정통신문 회신서 제출 체크판 연동 스크립트 (Code.gs)
 */

// 1. 시트 데이터 읽어오기 (웹앱 화면으로 명단 및 현황 전달)
function doGet() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const rows = sheet.getDataRange().getValues();
    
    // 1행(헤더: 번호, 이름, 제출여부, 체크시간) 제외하고 데이터 가공
    const list = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[0] === "" && row[1] === "") continue; // 빈 행 제외
      
      list.push({
        no: Number(row[0]) || i,
        name: String(row[1] || "").trim(),
        submitted: row[2] === "제출" || row[2] === true || row[2] === "O",
        checkedAt: row[3] ? String(row[3]) : ""
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      count: list.length,
      data: list
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 2. 제출 상태 업데이트 (터치 시 시트에 기록할 경우 사용)
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const rows = sheet.getDataRange().getValues();
    
    // payload 예시: { no: 1, submitted: true, checkedAt: "10:24" }
    let updated = false;
    for (let i = 1; i < rows.length; i++) {
      if (Number(rows[i][0]) === Number(payload.no)) {
        sheet.getRange(i + 1, 3).setValue(payload.submitted ? "제출" : "미제출");
        sheet.getRange(i + 1, 4).setValue(payload.checkedAt || "");
        updated = true;
        break;
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: updated ? "success" : "not_found"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. `Ctrl + S` (Mac: `Cmd + S`)를 눌러 저장합니다. 프로젝트 이름은 `제출체크판_API` 등으로 지정합니다.

---

## 3단계: 웹 앱(Web App) 배포하기

1. 오른쪽 상단의 파란색 **[배포]** 버튼을 누르고 **[새 배포]**를 선택합니다.
2. 왼쪽 톱니바퀴 아이콘 옆 **[유형 선택]**에서 **[웹 앱(Web App)]**을 선택합니다.
3. 설정을 다음과 같이 지정합니다.
   - **설명**: `v1`
   - **다음 사용자로 실행**: `나(내 계정)`
   - **액세스 권한이 있는 사용자**: **`모든 사용자 (Anyone)`** *(중요: 교실 TV 브라우저나 로그인 없이도 데이터를 불러올 수 있도록 설정)*
4. **[배포]** 버튼을 클릭합니다.
5. 계정 액세스 승인 팝업이 뜨면:
   - 본인 구글 계정 선택
   - "Google에서 확인하지 않은 앱" 경고가 뜨면 좌측 하단의 **[고급] > [프로젝트 이동(안전하지 않음)]** 클릭
   - **[허용]** 클릭
6. 배포 완료 창에 표시되는 **웹 앱 URL (`https://script.google.com/macros/s/.../exec`)**을 복사합니다.

---

## 4단계: 체크판 웹앱에 URL 입력하기

1. 제작된 `index.html` 파일을 브라우저로 실행합니다.
2. 상단 설정 또는 `[🔄 시트 불러오기]` 모달 입력창에 복사한 **웹 앱 URL**을 붙여넣습니다.
3. 이제 시트에 적힌 10명의 가상 학생 명단과 제출 상태가 화면에 연동됩니다.

---

## 🔒 보안 및 개인정보 보호 수칙

1. **가상 식별자 사용**: 학생 실명, 주민번호, 연락처 등 민감 개인정보는 절대 시트에 기재하지 않고, 본 설계 원칙에 따라 `가상01` ~ `가상10` 표시명을 사용합니다.
2. **비밀키 미노출**: 프런트엔드 코드(`index.html`)에 구글 서비스 계정 키나 비밀 토큰을 절대 하드코딩하지 않습니다.
3. **권한 제한**: 교실 내 단순 확인 보드 목적에 한정하여 읽기 전용으로 학생 명단을 안전하게 불러옵니다.
