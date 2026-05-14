# 📐 SCORING.md — Matemática do Bolão: Guia Completo

> **Para leigos:** Este documento explica, passo a passo, como o sistema calcula
> pontos do bolão, organiza a tabela de grupos e monta o bracket do mata-mata.
> Cada regra é mostrada em forma de conta matemática simples + exemplo prático.

---

## 📋 Índice

1. [Como funciona um grupo da Copa](#1-como-funciona-um-grupo-da-copa)
2. [Quem se classifica de cada grupo](#2-quem-se-classifica-de-cada-grupo)
3. [Como o bolão pontua — Grupos](#3-como-o-bolão-pontua--grupos)
4. [Como o bolão pontua — Mata-Mata](#4-como-o-bolão-pontua--mata-mata)
5. [Pontuação total máxima](#5-pontuação-total-máxima)
6. [Fórmula geral consolidada](#6-fórmula-geral-consolidada)
7. [Exemplos completos auditáveis](#7-exemplos-completos-auditáveis)
8. [Onde está esse código no projeto](#8-onde-está-esse-código-no-projeto)

---

## 1. Como funciona um grupo da Copa

### 🧩 Estrutura de um grupo

```
Cada grupo tem 4 times.
Todos jogam contra todos → chamamos isso de "round-robin".

Times: A, B, C, D
Jogos:
  Rodada 1:  A × B   e   C × D
  Rodada 2:  A × C   e   B × D
  Rodada 3:  A × D   e   B × C

Total de jogos por grupo = combinação de 4 times tomados 2 a 2:
  C(4,2) = 4! / (2! × 2!) = (4 × 3) / (2 × 1) = 6 jogos por grupo

Copa 2026 tem 12 grupos:
  12 grupos × 6 jogos = 72 jogos na fase de grupos ✓
```

---

### 🏆 Pontos por resultado de jogo

```
┌─────────────────────────────────────────────────────┐
│  Resultado           │  Mandante  │  Visitante       │
├─────────────────────────────────────────────────────┤
│  Vitória do mandante │   + 3 pts  │    + 0 pts       │
│  Empate              │   + 1 pt   │    + 1 pt        │
│  Vitória visitante   │   + 0 pts  │    + 3 pts       │
└─────────────────────────────────────────────────────┘
```

> **Exemplo simples:** Brasil 2 × 0 Marrocos
> → Brasil ganhou → Brasil recebe **+3 pts**, Marrocos recebe **+0 pts**

---

### 📊 Estatísticas que cada time acumula

```
Após cada jogo, o sistema atualiza para cada time T:

  GF(T) = Gols Feitos   = soma de todos os gols que T marcou
  GA(T) = Gols sofridos = soma de todos os gols que T levou
  GD(T) = Gols de Dif.  = GF(T) − GA(T)     ← pode ser negativo
  P(T)  = Pontos        = soma dos pontos em todos os jogos
  J(T)  = Jogos jogados = quantos jogos T disputou (máx. 6)
```

> **Exemplo com 2 jogos de um time:**
> ```
> Jogo 1: Brasil 3 × 1 Escócia  →  GF += 3, GA += 1
> Jogo 2: Brasil 2 × 2 Haiti    →  GF += 2, GA += 2
>
> Após 2 jogos:
>   GF(Brasil) = 3 + 2 = 5
>   GA(Brasil) = 1 + 2 = 3
>   GD(Brasil) = 5 − 3 = +2
>   P(Brasil)  = 3 + 1 = 4 pts
>   J(Brasil)  = 2 jogos
> ```

---

## 2. Quem se classifica de cada grupo

### 🥇 Ordem da tabela (desempate)

```
Quando dois ou mais times têm o mesmo número de pontos,
usamos estes critérios na ordem abaixo:

  1° critério:  P(T)   ↓  Quem tem MAIS pontos fica na frente
  2° critério:  GD(T)  ↓  Empate em pontos? Quem tem MAIOR saldo de gols
  3° critério:  GF(T)  ↓  Ainda empatado? Quem fez MAIS gols

Código (data.js):
  sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
         ↑ pontos ↑              ↑ saldo ↑        ↑ gols feitos ↑
```

> **Exemplo de desempate:**
> ```
> Time A: 6 pts, GD = +3, GF = 5  ← fica em 1°  (mais pontos)
> Time B: 4 pts, GD = +4, GF = 7  ← fica em 2°  (menos pontos)
> Time C: 4 pts, GD = +2, GF = 6  ← fica em 3°  (mesmo pts que B, mas saldo menor)
> Time D: 1 pt,  GD = -9, GF = 1  ← fica em 4°  (menos pontos)
> ```

---

### 🎟️ Quem passa de fase

```
Em cada grupo, 4 times → apenas 3 podem avançar:

  Posição 1° → Classificado DIRETO para a Rodada de 32
  Posição 2° → Classificado DIRETO para a Rodada de 32
  Posição 3° → Vai para o POOL dos melhores 3°s (pode ou não avançar)
  Posição 4° → ELIMINADO ✗

Copa 2026 tem 12 grupos:
  12 × 1°s = 12 times classificados diretos
  12 × 2°s = 12 times classificados diretos
  12 × 3°s = 12 candidatos → os 8 MELHORES passam

  Total que avança = 12 + 12 + 8 = 32 times → Rodada de 32 ✓
```

---

### 🏅 Como selecionar os 8 melhores terceiros

```
Passo 1: Pegar o 3° colocado de cada um dos 12 grupos → lista com 12 times
Passo 2: Ordenar esses 12 times pelos mesmos critérios da tabela:
         P(T) ↓, depois GD(T) ↓, depois GF(T) ↓
Passo 3: Os 8 primeiros da lista passam para a Rodada de 32

Código (data.js → getQualified):
  thirds.sort((a,b) => b.pts-a.pts || b.gd-a.gd || b.gf-a.gf)
  const best8thirds = thirds.slice(0, 8)
```

---

## 3. Como o bolão pontua — Grupos

### 🎯 O que o participante aposta

```
Para cada um dos 72 jogos, o participante digita:
  bH = quantos gols ele acha que o time da CASA (mandante) vai fazer
  bA = quantos gols ele acha que o time de FORA (visitante) vai fazer

Quando o jogo acontece, o admin registra o resultado real:
  rH = gols reais do mandante
  rA = gols reais do visitante
```

---

### 📐 A função "sinal" — coração do sistema

```
A função sinal (sign) transforma um placar em resultado:

  sign(placar_casa − placar_fora):
    → resultado = +1   se casa − fora > 0   (mandante ganhou)
    → resultado =  0   se casa − fora = 0   (empatou)
    → resultado = −1   se casa − fora < 0   (visitante ganhou)

Exemplo:
  sign(3 − 1) = sign(+2) = +1  → mandante ganhou
  sign(1 − 1) = sign( 0) =  0  → empate
  sign(0 − 2) = sign(−2) = −1  → visitante ganhou
```

---

### 💰 Quanto vale cada aposta de grupo

```
┌────────────────────────────────────────────────────────────────┐
│  Condição                                    │  Pontos ganhos  │
├────────────────────────────────────────────────────────────────┤
│  bH = rH  E  bA = rA                         │    + 3 pts      │
│  (acertou o PLACAR EXATO)                    │                 │
├────────────────────────────────────────────────────────────────┤
│  sign(bH−bA) = sign(rH−rA)                   │    + 1 pt       │
│  MAS não acertou o placar exato              │                 │
│  (acertou só o RESULTADO: quem ganhou)       │                 │
├────────────────────────────────────────────────────────────────┤
│  sign(bH−bA) ≠ sign(rH−rA)                   │    + 0 pts      │
│  (apostou no vencedor errado)                │                 │
├────────────────────────────────────────────────────────────────┤
│  Jogo ainda não aconteceu                    │    + 0 pts      │
│  (admin ainda não lançou o resultado)        │                 │
└────────────────────────────────────────────────────────────────┘
```

---

### 🧪 Exemplos detalhados de apostas de grupos

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXEMPLO 1 — Placar Exato (+3 pts) ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Aposta:     BRA 2 × 1 MAR   → bH=2, bA=1
  Real:       BRA 2 × 1 MAR   → rH=2, rA=1
  Verificação: bH=rH? 2=2 ✓   bA=rA? 1=1 ✓
  Resultado:  PLACAR EXATO → + 3 pts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXEMPLO 2 — Resultado Certo, Placar Errado (+1 pt) ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Aposta:     BRA 3 × 0 MAR   → bH=3, bA=0
  Real:       BRA 2 × 1 MAR   → rH=2, rA=1
  Verificação: Placar igual? 3≠2 → não é exato
               sign(3−0)= +1 = sign(2−1)= +1 ✓ mesmo vencedor
  Resultado:  RESULTADO CORRETO → + 1 pt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXEMPLO 3 — Empate real, apostou vitória (+0 pts) ❌
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Aposta:     BRA 2 × 0 MAR   → bH=2, bA=0
  Real:       BRA 1 × 1 MAR   → rH=1, rA=1
  Verificação: sign(2−0)= +1 ≠ sign(1−1)= 0
  Resultado:  ERRADO → + 0 pts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXEMPLO 4 — Apostou visitante, mandante ganhou (+0 pts) ❌
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Aposta:     BRA 0 × 2 MAR   → bH=0, bA=2
  Real:       BRA 2 × 1 MAR   → rH=2, rA=1
  Verificação: sign(0−2)= −1 ≠ sign(2−1)= +1
  Resultado:  ERRADO → + 0 pts
```

---

### 📈 Máximo de pontos na fase de grupos

```
  72 jogos × 3 pts (placar exato em todos) = 216 pts máximos
```

---

## 4. Como o bolão pontua — Mata-Mata

### ⚡ Estrutura do mata-mata

```
O mata-mata tem 31 jogos no total:

  Rodada de 32  →  16 jogos  (R32: 32 times entram, 16 passam)
  Oitavas       →   8 jogos  (16 times entram, 8 passam)
  Quartas       →   4 jogos  (8 times entram, 4 passam)
  Semifinais    →   2 jogos  (4 times entram, 2 passam)
  Final         →   1 jogo   (2 times entram, 1 é CAMPEÃO)
                   ────────
  Total         →  31 jogos
```

---

### 💰 Quanto vale cada aposta de mata-mata

```
┌─────────────────────────────────────────────────────┐
│  Condição                          │  Pontos ganhos  │
├─────────────────────────────────────────────────────┤
│  Apostou no time que GANHOU        │    + 2 pts      │
│  (qualquer rodada R32 até Final)   │                 │
├─────────────────────────────────────────────────────┤
│  Apostou no time que PERDEU        │    + 0 pts      │
├─────────────────────────────────────────────────────┤
│  Jogo ainda não disputado          │    + 0 pts      │
└─────────────────────────────────────────────────────┘
```

---

### 🏆 Bônus especial — Campeão

```
Este bônus é SEPARADO e ACUMULATIVO sobre o palpite da Final:

  Se você apostou no vencedor da Final:
    + 2 pts   (regra normal do mata-mata)
    + 5 pts   (bônus por acertar o CAMPEÃO)
    ──────────
    + 7 pts   no total pelo jogo da Final ← MÁXIMO POSSÍVEL EM 1 JOGO

  Se errou o vencedor da Final:
    + 0 pts   (nenhum ponto, nem bônus)
```

> **Por que 7 pts e não 5?**
> O sistema primeiro calcula +2 pts por qualquer acerto no mata-mata
> (incluindo a final), e depois adiciona +5 separadamente como bônus.
> São duas condições independentes no código.

---

### 📊 Pontuação máxima por fase do mata-mata

```
┌───────────────────────────────────────────────────────┐
│  Fase             │ Jogos  │ Pts/jogo │ Máx. na fase  │
├───────────────────────────────────────────────────────┤
│  Rodada de 32     │   16   │    × 2   │    32 pts     │
│  Oitavas de Final │    8   │    × 2   │    16 pts     │
│  Quartas de Final │    4   │    × 2   │     8 pts     │
│  Semifinais       │    2   │    × 2   │     4 pts     │
│  Final            │    1   │    × 2   │     2 pts     │
├───────────────────────────────────────────────────────┤
│  Subtotal KO      │   31   │          │    62 pts     │
│  Bônus Campeão    │    —   │          │  +  5 pts     │
├───────────────────────────────────────────────────────┤
│  TOTAL MÁXIMO KO  │        │          │    67 pts     │
└───────────────────────────────────────────────────────┘
```

---

## 5. Pontuação total máxima

```
┌──────────────────────────────────────────────────────────┐
│  Componente               │ Cálculo      │ Máximo        │
├──────────────────────────────────────────────────────────┤
│  Fase de Grupos (exatos)  │ 72 × 3       │   216 pts     │
│  Mata-Mata (vencedores)   │ 31 × 2       │    62 pts     │
│  Bônus Campeão            │  1 × 5       │     5 pts     │
├──────────────────────────────────────────────────────────┤
│  TOTAL MÁXIMO POSSÍVEL    │ 216+62+5     │   283 pts     │
└──────────────────────────────────────────────────────────┘
```

> **Curiosidade:** Para fazer 283 pts, o participante precisaria acertar
> todos os 72 placares exatos E todos os 31 vencedores do mata-mata
> E o campeão final. É praticamente impossível, mas é o teto matemático.

---

## 6. Fórmula geral consolidada

```
P(u) = Σ G(i)     +     Σ K(j)     +     B
       i=1..72          j=1..31
         ↑                 ↑               ↑
     grupos           mata-mata        bônus

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
G(i) — pontos do jogo i dos grupos:

  G(i) = 3   quando  bH_i = rH_i  E  bA_i = rA_i
  G(i) = 1   quando  sign(bH_i − bA_i) = sign(rH_i − rA_i)  E  G(i) ≠ 3
  G(i) = 0   caso contrário

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
K(j) — pontos do jogo j do mata-mata:

  K(j) = 2   quando  aposta_j = vencedor_real_j
  K(j) = 0   caso contrário

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
B — bônus campeão:

  B = 5   quando  aposta_final = campeão_real
  B = 0   caso contrário
```

---

## 7. Exemplos completos auditáveis

### 👤 Participante hipotético: "João"

```
═══════════════════════════════════════════════════════════════
GRUPOS (amostra de 4 jogos dos 72):
═══════════════════════════════════════════════════════════════

Jogo A_0 (BRA × SCO):
  João apostou: 3 × 0     Real: 3 × 0     → EXATO      +3 pts ✅

Jogo A_1 (MAR × HAI):
  João apostou: 1 × 0     Real: 2 × 1     → Resultado  +1 pt  ✓
  sign(1−0)=+1 = sign(2−1)=+1 → mesmo vencedor

Jogo B_0 (CAN × SUI):
  João apostou: 0 × 2     Real: 1 × 0     → Errado     +0 pts ❌
  sign(0−2)=−1 ≠ sign(1−0)=+1 → apostou no visitante, mandante ganhou

Jogo C_2 (BRA × HAI):
  João apostou: 4 × 0     Real: 4 × 0     → EXATO      +3 pts ✅

  Subtotal grupos (4 jogos): 3 + 1 + 0 + 3 = 7 pts

═══════════════════════════════════════════════════════════════
MATA-MATA (amostra de 3 jogos):
═══════════════════════════════════════════════════════════════

r32_01: João apostou BRA    Real: BRA    → Certo      +2 pts ✓
qf_01:  João apostou ARG    Real: FRA    → Errado     +0 pts ❌
final:  João apostou BRA    Real: BRA    → Certo      +2 pts (KO)
                                                      +5 pts (bônus campeão)

  Subtotal mata-mata (3 jogos): 2 + 0 + 2 + 5 = 9 pts

═══════════════════════════════════════════════════════════════
TOTAL DO EXEMPLO: 7 + 9 = 16 pts
═══════════════════════════════════════════════════════════════
```

---

## 8. Onde está esse código no projeto

```
js/data.js
  ├── SCORING = { exactScore:3, correctResult:1, knockoutWinner:2, championBonus:5 }
  │     └── Constantes de pontuação — altere aqui para mudar as regras
  ├── calcGroupStandings(groupBets)
  │     └── Calcula tabela de classificação a partir das apostas
  │         Usa: GF, GA, GD, P | Critérios: pts → gd → gf
  ├── getQualified(standings)
  │     └── Retorna os 32 classificados (12 primeiros + 12 segundos + 8 melhores terceiros)
  └── buildR32(qualified)
        └── Monta os 16 confrontos da Rodada de 32

js/ranking.js
  └── calculateScore(groupBets, knockoutBets, results)
        ├── Loop nos 72 jogos de grupos → aplica G(i)
        ├── Loop nos jogos do mata-mata → aplica K(j)
        └── Verificação do campeão → aplica B

js/results.js                               ← NOVO (v2)
  ├── initResultsPanel()
  │     └── Carrega resultados existentes e renderiza o painel admin
  ├── saveGroupResults(groupId, resultsMap)
  │     └── Valida e salva resultados de um grupo no Firestore
  ├── saveKoResult(matchId, winnerId)
  │     └── Salva vencedor de um jogo do mata-mata
  └── Prioridade: Firestore results/ SEMPRE sobrepõe a API externa
        A API (standings.js) é usada APENAS para exibição na aba "Classificação"
        O cálculo de pontos SEMPRE lê de results/ no Firestore

firestore.rules
  └── results/* → write: somente admin, read: qualquer autenticado
```

---

> 💡 **Nota sobre a API vs Resultados Manuais:**
> O sistema tem **duas fontes de dados independentes**:
>
> | Fonte | Usa para | Quem escreve |
> |-------|----------|--------------|
> | API-Football (externa) | Exibir tabela visual na aba "Classificação" | Automático |
> | Firestore `results/` | **Calcular pontos do bolão** | Admin manualmente |
>
> Elas **nunca conflitam** porque servem propósitos diferentes.
> Se a API cair, o bolão continua funcionando normalmente.
