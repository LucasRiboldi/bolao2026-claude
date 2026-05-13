# 🏆 Bolão Copa do Mundo 2026

Aplicação web completa para bolão de palpites da Copa do Mundo FIFA 2026.  
**Stack:** HTML · CSS · JavaScript puro · Firebase (Auth + Firestore + Hosting)  
**Sem build step** — funciona direto no browser após configurar o Firebase.

---

## Funcionalidades

| Feature | Detalhe |
|---|---|
| Autenticação | E-mail/senha via Firebase Auth |
| Fase de Grupos | 72 jogos, 12 grupos oficiais (draw Dez/2025) |
| Simulação de mata-mata | Calcula os 32 classificados a partir dos seus palpites |
| Bracket interativo | R32 → Oitavas → Quartas → Semis → Final |
| Pontuação | Exato +3 · Resultado +1 · KO +2 · Campeão +5 |
| Ranking | Placar público em tempo real |
| Mobile-first | Responsivo, inputs grandes, sem scroll horizontal indesejado |

---

## Configuração do Firebase

### 1. Criar projeto

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **Adicionar projeto** → nomeie (ex: `bolao-copa-2026`)
3. Desative o Google Analytics (opcional) → **Criar projeto**

### 2. Ativar Authentication

1. Menu lateral → **Authentication** → **Primeiros passos**
2. Aba **Sign-in method** → habilite **E-mail/senha** → Salvar

### 3. Criar Firestore

1. Menu lateral → **Firestore Database** → **Criar banco de dados**
2. Escolha **Modo de produção** (as regras de segurança já estão prontas)
3. Selecione a região mais próxima (ex: `us-east1`)

### 4. Configurar o app web

1. Clique na engrenagem ⚙️ → **Configurações do projeto**
2. Role até **Seus apps** → clique em **</>** (Web)
3. Registre o app (ex: `bolao-web`)
4. Copie o objeto `firebaseConfig`

### 5. Colar as credenciais

Abra `js/config.js` e substitua os valores `YOUR_*`:

```js
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSy...",
  authDomain:        "bolao-copa-2026.firebaseapp.com",
  projectId:         "bolao-copa-2026",
  storageBucket:     "bolao-copa-2026.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc..."
};
```

### 6. Aplicar regras de segurança

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # escolha seu projeto, aponte para firestore.rules
firebase deploy --only firestore:rules
```

---

## Deploy no Firebase Hosting

```bash
firebase init hosting
# Public directory: . (raiz do projeto)
# Single-page app: No
# Overwrite index.html: No

firebase deploy --only hosting
```

A URL do app aparecerá no terminal (ex: `https://bolao-copa-2026.web.app`).

---

## Inserir resultados reais (admin)

Os resultados reais são gravados manualmente no Firestore pelo administrador.

### Formato — Fase de Grupos
**Coleção:** `results` → **Documento:** `groupStage`

```json
{
  "A_0": { "homeGoals": 2, "awayGoals": 1 },
  "A_1": { "homeGoals": 0, "awayGoals": 0 },
  "B_2": { "homeGoals": 3, "awayGoals": 2 }
}
```

ID do jogo: `{GRUPO}_{0-5}` seguindo a ordem do arquivo `js/data.js`.

### Formato — Mata-Mata
**Coleção:** `results` → **Documento:** `knockout`

```json
{
  "r32_01": "brazil",
  "r32_02": "usa",
  "r16_01": "brazil",
  "final":  "brazil"
}
```

O valor é o `id` interno da seleção (ex: `brazil`, `argentina`, `france`).  
Veja todos os IDs em `js/data.js` → constante `TEAMS`.

---

## Atualizar o Ranking agregado

Após inserir resultados, recalcule o ranking executando no Firebase Console (Firestore) ou via Cloud Function. Para bolões pequenos, o ranking é calculado diretamente no cliente ao abrir a aba **Ranking**.

Para bolões grandes (100+ usuários), crie uma Cloud Function que:
1. Leia todos os `users/*/bets/*`
2. Calcule pontos com `calculateScore` (lógica em `js/ranking.js`)
3. Grave em `ranking/current`

---

## Estrutura de arquivos

```
bolao-copa-2026/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── config.js       ← suas credenciais Firebase
│   ├── data.js         ← times, grupos, fixtures, simulação
│   ├── utils.js        ← toast, loading, helpers
│   ├── db.js           ← CRUD Firestore
│   ├── auth.js         ← login / cadastro
│   ├── groupStage.js   ← fase de grupos UI
│   ├── knockout.js     ← bracket mata-mata UI
│   ├── ranking.js      ← pontuação e ranking
│   └── app.js          ← controlador principal
├── firestore.rules
└── README.md
```

---

## Regras de Pontuação

| Acerto | Pontos |
|---|---|
| Placar exato (grupos) | +3 |
| Resultado correto, placar errado (grupos) | +1 |
| Vencedor correto (mata-mata, qualquer rodada) | +2 |
| Bônus: acertar o campeão (final) | +5 |

---

## Times e Grupos Oficiais (Copa 2026)

| Grupo | Times |
|---|---|
| A | 🇲🇽 México · 🇿🇦 África do Sul · 🇰🇷 Coreia do Sul · 🇨🇿 Tchéquia |
| B | 🇨🇦 Canadá · 🇨🇭 Suíça · 🇶🇦 Catar · 🇧🇦 Bósnia |
| C | 🇧🇷 Brasil · 🇲🇦 Marrocos · 🇭🇹 Haiti · 🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escócia |
| D | 🇺🇸 EUA · 🇵🇾 Paraguai · 🇦🇺 Austrália · 🇹🇷 Turquia |
| E | 🇩🇪 Alemanha · 🇨🇼 Curaçao · 🇨🇮 Costa do Marfim · 🇪🇨 Equador |
| F | 🇳🇱 Holanda · 🇯🇵 Japão · 🇹🇳 Tunísia · 🇸🇪 Suécia |
| G | 🇧🇪 Bélgica · 🇪🇬 Egito · 🇮🇷 Irã · 🇳🇿 Nova Zelândia |
| H | 🇪🇸 Espanha · 🇨🇻 Cabo Verde · 🇸🇦 Arábia Saudita · 🇺🇾 Uruguai |
| I | 🇫🇷 França · 🇸🇳 Senegal · 🇳🇴 Noruega · 🇮🇶 Iraque |
| J | 🇦🇷 Argentina · 🇩🇿 Argélia · 🇦🇹 Áustria · 🇯🇴 Jordânia |
| K | 🇵🇹 Portugal · 🇺🇿 Uzbequistão · 🇨🇴 Colômbia · 🇨🇩 RD Congo |
| L | 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra · 🇭🇷 Croácia · 🇬🇭 Gana · 🇵🇦 Panamá |
