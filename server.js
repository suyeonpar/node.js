const express = require('express');
const app = express();
const dotenv = require('dotenv');

dotenv.config();

app.set('view engine', 'ejs'); //ejs셋팅 문법

const {MongoClient, ObjectId} = require('mongodb');

let db;
let sample;
const url = `mongodb+srv://${process.env.MONGODB_ID}:${process.env.MONGODB_PW}@admin.z9ho4mc.mongodb.net/`
app.use(express.static(__dirname + '/public'))

new MongoClient(url).connect().then((client)=>{
    db = client.db("board");
    sample = client.db("sample_training")
    console.log("db연결완료!!")
    app.listen(process.env.SERVER_PORT, ()=>{
        console.log(`${process.env.SERVER_PORT}번호에서 서버 실행 중`)
    })
}).catch((error)=>{
    console.log(error);
})

// app.listen(5000, ()=>{
//     console.log("5000번 포트 서버 실행")
// })

app.get('/', (req,res)=>{
    //res.send("Hellow world");
    res.sendFile(__dirname + '/page/index.html')
}) //sendFile 파일을 내보내겠다 

app.get('/about', (req,res)=>{
    //res.send("어바웃 페이지");
    res.sendFile(__dirname + '/page/about.html')
    // db.collection("notice").insertOne({
    //     title : "첫번째 글",
    //     content : "두번째 글"
    // })
})

app.get('/list', async (req,res)=>{

    const result = await db.collection("notice").find().toArray()
    console.log(result[0])

    res.render("list.ejs", {
        data : result
    }); //데이터를 다 보내준다.
})

app.get('/notice', (req,res)=>{
    res.send("노티스 페이지");
})

app.get('/view/:id', async (req,res)=>{
    const result = await db.collection("notice").findOne({
        _id : new ObjectId(req.params.id)
    })
    console.log(result)
    // send는 2개 보낼 수 없다.
    res.render("view.ejs", {
        data : result
    });
})

app.get('/view/:content', async (req,res)=>{

})

app.get('/portfolio', (req,res)=>{
    res.send("포트폴리오 페이지");
})

// 1. Uniform Interface
// 여러 URL 과 METHOD 는 일관성이 있어야 하며, 하나의 URL에서는 하나의 데이터만 가져오게 디자인하며, 간결하고 예측 가능한 URL과 METHOD를 만들어야 한다.
// 동사보다는 명사 위주
// 띄어쓰기는 언더바 대신 대시 기호
// 파일 확장자는 사용금지
// 하위 문서를 뜻할 땐 / 기호를 사용

// 2. 클라이언트와 서버역할 구분
// 유저에게 서버 역할을 맡기거나 직접 입출력을 시키면 안된다.

// 3. stateless
// 요청들은 서로 의존성이 있으면 안되고, 각각 독립적으로 처리되어야 한다.

// 4. Cacheable
// 서버가 보내는 자료는 캐싱이 가능해야한다. - 대부분 컴퓨터가 동작

// 5. Layered System
// 서버 기능을 만들 때 레이어를 걸쳐서 코드가 실행되어야 한다.(몰라도 됨)

// 6. Code on Demeand
// 서버는 실행 가능한 코드를 보낼 수 있다. (몰라도 됨)
