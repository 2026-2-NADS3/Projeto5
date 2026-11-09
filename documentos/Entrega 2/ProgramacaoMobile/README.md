# Próxima Etapa: App Android - Entrega 2

Aplicativo Android (Java) da **Próxima Etapa**. Com ele, estudantes podem se inscrever em cursos e palestras de universidades parceiras, usar o ingresso com QR Code, acompanhar presenças, baixar certificados, encontrar bolsas, fazer testes de perfil (DISC e vocacional) e tirar dúvidas com a assistente **ProxIA**.

O back-end é o **Supabase** (login, banco de dados e funções). O app também funciona sem internet, usando os dados salvos no celular (Room), e sincroniza quando a conexão volta.

---

## Login para teste

Para testar o app direto, sem criar conta:

| E-mail | Senha |
|---|---|
| `test@gmail.com` | `123456` |

---

## Requisitos

- **Android Studio** atualizado (com suporte ao Android Gradle Plugin 9)
- **Android SDK 37** (o Android Studio instala sozinho na primeira sincronização)
- Um **emulador** ou **celular Android 7.0 (API 24) ou superior**
- **Internet** no computador e no emulador/celular

> O Java (JDK) usado pelo Gradle é baixado automaticamente. Não é preciso instalar nada à parte.

---

## Como rodar

### 1. Baixar e abrir o projeto

O código está no GitHub: **https://github.com/2026-2-NADS3/Projeto5**

**Opção A – pelo terminal (Git)**
```bash
git clone https://github.com/2026-2-NADS3/Projeto5.git
```

**Opção B – pelo Android Studio**
1. Na tela inicial, clique em **Clone Repository** (ou **File → New → Project from Version Control…**)
2. Em **URL**, cole `https://github.com/2026-2-NADS3/Projeto5.git`
3. Escolha a pasta onde salvar e clique em **Clone**

**Opção C – sem Git**
Na página do repositório, clique em **Code → Download ZIP** e extraia o arquivo.

**Abrir no Android Studio**

O repositório tem outras pastas além do app. No Android Studio, use **File → Open** e selecione **esta pasta**:

```
Projeto5/documentos/Entrega 2/ProgramacaoMobile/Entrega2ProximaEtapa
```

> Abra a pasta `Entrega2ProximaEtapa`, e não a pasta `Projeto5` inteira. Senão o Android Studio não reconhece o projeto Android.

### 2. Configurar o Supabase
Abra o arquivo **`local.properties`**, na raiz do projeto. O Android Studio cria esse arquivo sozinho ao abrir o projeto. **Copie e cole no final do arquivo:**

```properties
SUPABASE_URL=https://yenrfsbehpdehsyahmgs.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllbnJmc2JlaHBkZWhzeWFobWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4MjAzNzUsImV4cCI6MjEwOTM5NjM3NX0.ECKgAZDmfyfjZRFL9tT25EfzFW-fJK_dJzOhFX5KfRo
```

Esses são a URL e a chave **pública (anon)** do Supabase da Próxima Etapa. Essa chave foi feita para ficar dentro do app. Os dados continuam protegidos pelas regras de acesso do banco (RLS), e cada aluno só vê os próprios dados.

> O `local.properties` **não vai para o Git**, por isso é preciso colar essas duas linhas depois de baixar o projeto.
> ⚠️ Se for usar outro projeto do Supabase, pegue os valores em **Project Settings → API**. Nunca use a chave `service_role` / *secret* no app.

### 3. Sincronizar
**File → Sync Project with Gradle Files** e aguarde terminar.

### 4. Executar
Escolha um emulador ou celular na barra de cima e clique em **Run ▶**.

### 5. Entrar
Use o **login para teste** lá de cima, ou toque em **"Cadastrar conta nova"**.

---

## Testes automatizados

O projeto tem testes de unidade das regras do app: presença, certificados, badges, QR Code do ingresso, testes de perfil e ProxIA.

- **No Android Studio:** clique com o botão direito em `app/src/test/java` → **Run 'Tests in java'**
- **No terminal**, na pasta do projeto:
  ```bash
  gradlew.bat :app:testDebugUnitTest      # Windows
  ./gradlew :app:testDebugUnitTest        # macOS / Linux
  ```

---

## Estrutura do código

O código fica em `app/src/main/java/com/example/proximaetapa/`:

| Pasta | O que tem |
|---|---|
| `ui/` | Telas (Activities e Fragments), adapters e componentes visuais |
| `data/local/` | Banco local (Room): entidades e DAOs |
| `data/remote/` | Comunicação com o Supabase (Retrofit + OkHttp) |
| `data/repository/` | Junta os dados locais e remotos para as telas |
| `domain/` | Regras do app: presença, certificados, badges, check-in e ProxIA |
| `sync/` | Sincronização em segundo plano (WorkManager) |
| `util/` | Sessão, datas, notificações, QR Code e PDF do certificado |

---

## Problemas comuns

| Mensagem no app | O que fazer |
|---|---|
| **"Supabase não configurado"** | Preencha `SUPABASE_URL` e `SUPABASE_KEY` no `local.properties` (passo 2), faça o Sync e rode de novo. |
| **"Não foi possível encontrar o servidor"** | Confira se a `SUPABASE_URL` está certa e se o emulador/celular tem internet. |
| **"E-mail ou senha incorretos"** | A conexão funcionou. Confira o e-mail e a senha. |
| Dados desatualizados | **Menu → Configurações → Sincronizar agora**. |

