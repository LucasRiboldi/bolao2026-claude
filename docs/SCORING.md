# 📐 SCORING.md — Sistema Matemático Completo do Bolão Copa 2026

> Este documento é a fonte de verdade para todas as regras, fórmulas e critérios de desempate
> aplicados no bolão. Qualquer alteração nas regras deve ser refletida aqui primeiro.

---

## Índice

1. [Estrutura da Copa 2026](#1-estrutura-da-copa-2026)
2. [Fase de Grupos — como funciona](#2-fase-de-grupos--como-funciona)
3. [Classificação e desempate (H2H)](#3-classificação-e-desempate-h2h)
4. [Quem passa de fase](#4-quem-passa-de-fase)
5. [Pontuação — Fase de Grupos](#5-pontuação--fase-de-grupos)
6. [Pontuação — Mata-Mata](#6-pontuação--mata-mata)
7. [Critério de desempate do ranking](#7-critério-de-desempate-do-ranking)
8. [Fórmula geral consolidada](#8-fórmula-geral-consolidada)
9. [Pontuação máxima possível](#9-pontuação-máxima-possível)
10. [Exemplos auditáveis](#10-exemplos-auditáveis)
11. [Mapa de código](#11-mapa-de-código)

---

## 1. Estrutura da Copa 2026

```
48 seleções  ·  3 países-sede (USA, CAN, MEX)  ·  104 jogos no total

┌─────────────────────────────────────────────────────────────┐
│  FASE DE GRUPOS                                             │
│  12 grupos × 4 times × 6 jogos = 72 jogos                  │
│  Classificam: 1°, 2° de cada grupo + 8 melhores 3°s = 32   │
├─────────────────────────────────────────────────────────────┤
│  MATA-MATA (32 jogos)                                       │
│  Rodada 32  → 16 jogos  → 16 classificados                 │
│  Oitavas    →  8 jogos  →  8 classificados                 │
│  Quartas    →  4 jogos  →  4 classificados                 │
│  Semifinais →  2 jogos  →  2 finalistas                    │
│  3º Lugar   →  1 jogo   →  bronze                          │
│  Final      →  1 jogo   →  CAMPEÃO                         │
│                          32 jogos no mata-mata total        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Fase de Grupos — como funciona

### Round-Robin: todos jogam contra todos

```
Grupo com times A, B, C, D → 6 jogos por grupo:

  Rodada 1:  A × B   |   C × D
  Rodada 2:  A × C   |   B × D
  Rodada 3:  A × D   |   B × C

  C(4,2) = 6 jogos  ·  12 grupos × 6 = 72 jogos total
```

### Pontos por resultado de jogo

```
┌──────────────────┬────────────┬────────────┐
│ Resultado        │ Mandante   │ Visitante  │
├──────────────────┼────────────┼────────────┤
│ Vitória casa     │   +3 pts   │   +0 pts   │
│ Empate           │   +1 pt    │   +1 pt    │
│ Vitória visitante│   +0 pts   │   +3 pts   │
└──────────────────┴────────────┴────────────┘
```

### Estatísticas acumuladas por time

```
P(T)  = Pontos totais
GF(T) = Gols Feitos (soma de todos os gols marcados)
GA(T) = Gols Sofridos (soma de todos os gols levados)
GD(T) = Saldo = GF(T) − GA(T)   ← pode ser negativo
J(T)  = Jogos disputados (0–6)
```

---

## 3. Classificação e desempate (H2H)

O critério de desempate segue as regras oficiais da FIFA para grupos,
aplicando **Head-to-Head (H2H) antes das estatísticas gerais**.

### Algoritmo passo a passo

```
PASSO 1 — Ordenar por pontos:
  Todos os 4 times do grupo são ordenados por P(T) ↓.

PASSO 2 — Identificar grupos de empatados:
  Se dois ou mais times têm exatamente o mesmo P(T),
  aplicar os critérios abaixo APENAS entre eles.

PASSO 3 — Critério H2H (apenas jogos entre os times empatados):
  3a. H2H_P(T)   ↓   Quem ganhou mais nos confrontos diretos?
  3b. H2H_GD(T)  ↓   Maior saldo de gols nos confrontos diretos?
  3c. H2H_GF(T)  ↓   Mais gols marcados nos confrontos diretos?

PASSO 4 — Estatísticas gerais (se ainda empatado após H2H):
  4a. GD(T)   ↓   Maior saldo de gols em todos os jogos do grupo
  4b. GF(T)   ↓   Mais gols marcados em todos os jogos do grupo

PASSO 5 — (não implementado, raramente necessário):
  Ranking FIFA · Sorteio
```

> **Por que H2H primeiro?** É a regra oficial FIFA desde 2017.
> O confronto direto entre os times empatados é mais decisivo
> do que estatísticas gerais que incluem adversários diferentes.

### Exemplo de H2H com 3 times empatados

```
Times empatados em 4 pts: BRA, ARG, ESP

Jogos entre eles:
  BRA 2-0 ARG  → BRA +3pts H2H, ARG +0pts H2H
  BRA 1-1 ESP  → BRA +1pt H2H,  ESP +1pt H2H
  ARG 2-0 ESP  → ARG +3pts H2H, ESP +0pts H2H

H2H_P: BRA=4  ARG=3  ESP=1
Ordem: 1°BRA  2°ARG  3°ESP  ← decidido por H2H_P sem precisar de GD
```

### Cálculo H2H no código (data.js)

```javascript
function _h2hStats(teamIds, results) {
  // Filtra apenas os jogos entre os times do grupo empatado
  const set = new Set(teamIds);
  for (const r of results) {
    if (!set.has(r.home) || !set.has(r.away)) continue; // ignora jogos externos
    // acumula GF, GA, pts apenas nos confrontos diretos
  }
}

function _rankGroupTeams(teams, results) {
  teams.sort((a, b) => b.pts - a.pts);           // 1. pontos gerais
  // Para cada grupo de times com o mesmo pts:
  const h2h = _h2hStats(tied.map(t => t.id), results);
  tied.sort((a, b) =>
    hb.pts - ha.pts     // H2H_P
    || hb.gd - ha.gd   // H2H_GD
    || hb.gf - ha.gf   // H2H_GF
    || b.gd  - a.gd    // GD geral
    || b.gf  - a.gf    // GF geral
  );
}
```

---

## 4. Quem passa de fase

```
Por grupo (4 times):
  1° → classificado direto para Rodada de 32
  2° → classificado direto para Rodada de 32
  3° → entra no pool dos melhores 3°s (pode ou não avançar)
  4° → eliminado ✗

Pool dos 3°s:
  12 grupos × 1 terceiro = 12 candidatos
  Ordenados por: P ↓ · GD ↓ · GF ↓
  Os 8 melhores passam → completam os 32 times do mata-mata

Total classificados = 12 primeiros + 12 segundos + 8 melhores terceiros = 32
```

---

## 5. Pontuação — Fase de Grupos

### O que o participante aposta

```
Para cada um dos 72 jogos:
  bH = gols que o mandante (casa) vai fazer    ← aposta do usuário
  bA = gols que o visitante vai fazer          ← aposta do usuário

Quando o jogo ocorre, o admin registra:
  rH = gols reais do mandante
  rA = gols reais do visitante
```

### A função sinal (sign)

```
sign(x):  +1  se x > 0  (mandante ganhou)
           0  se x = 0  (empate)
          −1  se x < 0  (visitante ganhou)

Transforma placar → resultado para comparação:
  sign(3−1) = +1    sign(1−3) = −1    sign(2−2) = 0
```

### Tabela de pontuação por jogo

```
┌──────────────────────────────────────────────────────────┬──────────┐
│ Condição                                                 │ Pontos   │
├──────────────────────────────────────────────────────────┼──────────┤
│ bH = rH  E  bA = rA        → PLACAR EXATO               │  +3 pts  │
├──────────────────────────────────────────────────────────┼──────────┤
│ sign(bH−bA) = sign(rH−rA)  → resultado certo (não exato)│  +1 pt   │
├──────────────────────────────────────────────────────────┼──────────┤
│ sign(bH−bA) ≠ sign(rH−rA)  → resultado errado           │  +0 pts  │
├──────────────────────────────────────────────────────────┼──────────┤
│ Resultado ainda não lançado pelo admin                   │  +0 pts  │
└──────────────────────────────────────────────────────────┴──────────┘
```

### Exemplos de grupos

```
EXEMPLO 1 — Placar exato
  Aposta: BRA 2 × 1 MAR  ·  Real: 2 – 1  →  +3 pts ✅

EXEMPLO 2 — Resultado certo, placar errado
  Aposta: BRA 3 × 0 MAR  ·  Real: 2 – 1
  sign(3−0)=+1 = sign(2−1)=+1  → mesmo vencedor  →  +1 pt ✓

EXEMPLO 3 — Errado (apostou empate, houve vitória)
  Aposta: BRA 1 × 1 MAR  ·  Real: 2 – 0
  sign(1−1)=0 ≠ sign(2−0)=+1  →  +0 pts ❌

EXEMPLO 4 — Errado (apostou visitante, mandante ganhou)
  Aposta: BRA 0 × 2 MAR  ·  Real: 2 – 1
  sign(0−2)=−1 ≠ sign(2−1)=+1  →  +0 pts ❌
```

---

## 6. Pontuação — Mata-Mata

### Regra geral: "o time avançou de fase?"

O palpite do mata-mata pontua se o **time apostado avançou para a fase seguinte**,
independentemente de qual slot/partida específica ele disputou no bracket real.

```
┌──────────────────────────────────────────────────────────┬──────────┐
│ Condição                                                 │ Pontos   │
├──────────────────────────────────────────────────────────┼──────────┤
│ O time apostado AVANÇOU de fase (ganhou na rodada)       │  +2 pts  │
├──────────────────────────────────────────────────────────┼──────────┤
│ O time apostado FOI ELIMINADO                            │  +0 pts  │
├──────────────────────────────────────────────────────────┼──────────┤
│ Fase ainda não disputada                                 │  +0 pts  │
└──────────────────────────────────────────────────────────┴──────────┘
```

> **Por que "avançou" e não "ganhou a partida exata"?**
> O bracket é gerado automaticamente a partir dos palpites dos grupos.
> Se os grupos reais diferirem do previsto, os times aparecem em slots
> diferentes. A regra "avançou" garante recompensa por acertar o time certo
> independentemente do slot no bracket.

### Exemplo da regra "avançou"

```
Você apostou:   r32_01 → Brasil
Resultado real: r32_01 → Argentina (venceu aqui)
                r32_07 → Brasil    (venceu aqui — bracket real diferente)

Sistema antigo (slot exato):  0 pts  ← Brasil não venceu r32_01
Sistema atual  (avançou):    +2 pts  ← Brasil avançou da R32, independente do slot
```

### Implementação — conjuntos de times que avançaram

```javascript
const advanced = {
  r32: new Set(),   // times que venceram na Rodada de 32
  r16: new Set(),   // times que venceram nas Oitavas
  qf:  new Set(),   // times que venceram nas Quartas
  sf:  new Set(),   // times que venceram nas Semis
};

for (const [matchId, winnerId] of Object.entries(koResults)) {
  if      (matchId.startsWith('r32_')) advanced.r32.add(winnerId);
  else if (matchId.startsWith('r16_')) advanced.r16.add(winnerId);
  else if (matchId.startsWith('qf_'))  advanced.qf.add(winnerId);
  else if (matchId.startsWith('sf_'))  advanced.sf.add(winnerId);
}
```

### Exceções: 3º Lugar e Final

```
3° Lugar (matchId = 'third'):
  ⚠️  NÃO usa a regra "avançou" — usa acerto EXATO do vencedor
  O perdedor das semis que ganhar a disputa de bronze deve ser
  o time que você apostou exatamente.

  3° lugar certo  →  +2 pts
  3° lugar errado →  +0 pts

Final (matchId = 'final'):
  Usa acerto EXATO do campeão (não "avançou").
  Campeão correto →  +2 pts  (acerto KO normal)
                  +  +5 pts  (bônus especial)
                  =  +7 pts  no total pela Final

  Campeão errado  →  +0 pts
```

### Disputa de 3° Lugar — como os times são resolvidos

```
Os finalistas são os vencedores das Semifinais:
  sf_01: W:qf_01 × W:qf_02
  sf_02: W:qf_03 × W:qf_04

Os perdedores das Semis disputam o 3° lugar:
  third: L:sf_01 × L:sf_02   ← L: = Loser (perdedor)

O sistema rastreia o perdedor usando prevResolved:
  prevResolved[matchId] = { home, away }
  O time que NÃO é o vencedor de matchId é o perdedor.
```

---

## 7. Critério de desempate do ranking

Quando dois participantes têm a mesma pontuação, usa-se:

```
1° Pontuação total (pts) ↓
2° Placares exatos (exact) ↓     ← quem acertou mais placares exatos
3° Resultados corretos (result) ↓
4° Acertos no mata-mata (ko) ↓
5° Ordem alfabética do nome ↑

Código (ranking.js e seed-server.js):
  entries.sort((a, b) =>
    b.pts              - a.pts              ||
    b.breakdown.exact  - a.breakdown.exact  ||
    b.breakdown.result - a.breakdown.result ||
    b.breakdown.ko     - a.breakdown.ko     ||
    a.name.localeCompare(b.name, 'pt-BR')
  );
```

---

## 8. Fórmula geral consolidada

```
P(u) =  Σ G(i)      +      Σ K(j)      +      B
        i=1..72             j=1..32
           ↑                   ↑                ↑
       grupos             mata-mata           bônus

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
G(i) — pontos do jogo i dos grupos:

  G(i) = 3   quando  bH_i = rH_i  E  bA_i = rA_i          (exato)
  G(i) = 1   quando  sign(bH_i−bA_i) = sign(rH_i−rA_i)
                      E  G(i) ≠ 3                           (resultado)
  G(i) = 0   caso contrário

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
K(j) — pontos da aposta j do mata-mata:

  Para as rodadas R32, R16, QF, SF:
    A(r, t) = 1  se o time t avançou na rodada r
    K(j) = 2  quando A(rodada(j), aposta_j) = 1
    K(j) = 0  caso contrário

  Para 3° Lugar e Final (acerto exato):
    K('third') = 2  quando aposta_third = vencedor_real_third
    K('final') = 2  quando aposta_final = campeão_real
    K(j) = 0  caso contrário

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
B — bônus campeão:

  B = 5  quando aposta_final = campeão_real
  B = 0  caso contrário
```

---

## 9. Pontuação máxima possível

### Por fase do mata-mata

```
┌──────────────────────┬────────┬───────────┬──────────────┐
│ Fase                 │ Apost. │ Pts/acerto│ Máx. na fase │
├──────────────────────┼────────┼───────────┼──────────────┤
│ Rodada de 32         │   16   │   × 2     │    32 pts    │
│ Oitavas de Final     │    8   │   × 2     │    16 pts    │
│ Quartas de Final     │    4   │   × 2     │     8 pts    │
│ Semifinais           │    2   │   × 2     │     4 pts    │
│ 3° Lugar             │    1   │   × 2     │     2 pts    │
│ Final                │    1   │   × 2     │     2 pts    │
├──────────────────────┼────────┼───────────┼──────────────┤
│ Subtotal KO          │   32   │           │    64 pts    │
│ Bônus Campeão        │    —   │           │  +  5 pts    │
├──────────────────────┼────────┼───────────┼──────────────┤
│ TOTAL MÁXIMO KO      │        │           │    69 pts    │
└──────────────────────┴────────┴───────────┴──────────────┘
```

### Total geral

```
┌────────────────────────────────────────────────────────┐
│ Componente                  │ Cálculo    │ Máximo      │
├────────────────────────────────────────────────────────┤
│ Fase de Grupos (exatos)     │ 72 × 3     │  216 pts    │
│ Mata-Mata (acertos KO)      │ 32 × 2     │   64 pts    │
│ Bônus Campeão               │  1 × 5     │    5 pts    │
├────────────────────────────────────────────────────────┤
│ TOTAL MÁXIMO POSSÍVEL       │ 216+64+5   │  285 pts    │
└────────────────────────────────────────────────────────┘

Para atingir 285 pts, o participante precisaria acertar:
  · todos os 72 placares exatos dos grupos
  · todos os 32 vencedores do mata-mata
  · o campeão da Final
É matematicamente possível, mas extremamente improvável.
```

---

## 10. Exemplos auditáveis

### Participante hipotético — João

```
GRUPOS (amostra de 4 jogos):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  A_0 (BRA × SCO):  João: 3-0  ·  Real: 3-0  → EXATO       +3 pts ✅
  A_1 (MAR × HAI):  João: 1-0  ·  Real: 2-1  → Resultado   +1 pt  ✓
  B_0 (CAN × SUI):  João: 0-2  ·  Real: 1-0  → Errado      +0 pts ❌
  C_2 (BRA × HAI):  João: 4-0  ·  Real: 4-0  → EXATO       +3 pts ✅

  Subtotal grupos (4 jogos): 3+1+0+3 = 7 pts

MATA-MATA (amostra):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  r32_01: João: BRA  ·  Real: BRA avançou   → +2 pts ✓
  qf_01:  João: ARG  ·  Real: FRA avançou   → +0 pts ❌
  third:  João: ESP  ·  Real (exato): ESP   → +2 pts ✓
  final:  João: BRA  ·  Real (exato): BRA   → +2 pts ✓ + +5 pts bônus

  Subtotal mata-mata: 2+0+2+2+5 = 11 pts

TOTAL: 7 + 11 = 18 pts
```

---

## 11. Mapa de código

```
js/data.js
  ├── SCORING = { exactScore:3, correctResult:1, knockoutWinner:2, championBonus:5 }
  │     └── Constantes — altere aqui para mudar as regras de pontuação
  ├── generateGroupGames(gId) → 6 jogos por grupo (C(4,2))
  ├── _h2hStats(teamIds, results) → estatísticas H2H entre times empatados
  ├── _rankGroupTeams(teams, results) → ordenação com H2H tiebreaker
  ├── calcGroupStandings(groupBets) → tabela completa dos 12 grupos
  ├── getQualified(standings) → 32 classificados (1°s + 2°s + 8 melhores 3°s)
  ├── buildR32(qualified) → 16 confrontos da Rodada de 32
  └── resolveKnockoutRound(matches, koBets, prevResolved)
        ├── W:matchId → vencedor apostado daquele confronto
        └── L:matchId → perdedor (calculado de prevResolved)

js/ranking.js
  └── calculateScore(groupBets, knockoutBets, results) → { pts, breakdown }
        ├── Loop 72 grupos → aplica G(i)
        ├── Sets de times que avançaram por fase
        ├── Loop mata-mata → aplica K(j) com regra "avançou"
        ├── 3° lugar → acerto exato
        └── Final → acerto exato + bônus B

js/knockout.js
  ├── _simulate() → chama calcGroupStandings + getQualified + buildR32
  └── _renderBracket() → renderiza rounds acumulando prevResolved para L:

js/results.js (admin)
  ├── Painel com tabs: Grupos / Mata-Mata
  ├── Escreve em results/groupStage e results/knockout no Firestore
  └── FieldValue.delete() para apagar resultados individuais

seed-server.js (dev)
  ├── Replica calcGroupStandings, getQualified, buildR32, resolveKnockoutRound
  ├── calcScore() → mesma lógica de calculateScore do client
  └── handleUnitTests() → 32 testes automáticos via SSE

firestore.rules
  └── results/* → write: isAdmin()  ·  read: request.auth != null
```

---

> 💡 **Dica de auditoria:**
> Execute os 32 testes unitários em `test-seed.html → 🧪 Testes Unitários`
> para verificar que toda a matemática está funcionando corretamente.
> Cada teste exibe o valor esperado vs o obtido em tempo real.
