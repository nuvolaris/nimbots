<script lang="ts">
  import fetch from "cross-fetch";
  import { OpenWhisk } from "./openwhisk";
  import { VERSION } from "./const";
  import { BattleWeb } from "./battleweb";
  import { AssetsLoader } from "./util";
  import { onMount, afterUpdate, onDestroy } from "svelte";
  import { inspector, source, submitting, rewards } from "./store";
  import { log } from "./robot";
  import { rumblePublic } from "./rumble";
  import Submit from "./Submit.svelte";

  export let base: string;
  export let apihost: string;
  export let namespace: string;
  export let ow: OpenWhisk;

  let battle: BattleWeb;
  let msg = ow === undefined ? "" : "Choose opponents";
  let status = "Select Opponents";

  let ready = false;
  let debug = false;
  let extra = "";

  let myBot: string;
  let enemyBot: string;

  let fighting = false;
  let editing = false;

  let robotName = "";
  let robotType = "js";

  let myBots: string[] = [];

  let enemyBots: { name: string; url: string; rewards: number }[] = [];
  let cyanBots = enemyBots;
  let redBots = enemyBots;
  let searchCyanBot = "";
  let searchRedBot = "";
  let filteredCyanBots = cyanBots;
  let filteredMyBots = myBots;
  let filteredRedBots = redBots;
  let canStartBattle = true;

  let robotMap = {
    js: base+"/src/JsBot.js",
    go: base+"/src/GoBot.go",
    py: base+"/src/PyBot.py",
  };
  let regex = /^\w{1,60}$/g;

  function login() {
    fetch(base+"/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        password: prompt("Password:"),
      }),
    })
      .then((r) => r.json())
      .then((r) => {
        console.log(r)
        if ("error" in r) {
          alert(r.error);
        } else {
          if("token" in r) {
            alert("OK!")
            ow = new OpenWhisk(apihost, r["token"], namespace);
            window["ow"] = ow;
          }
        }
      })
      .catch((ex) => {
        console.log(ex);
        alert("Unexpected error - check logs");
      });
  }

  async function create(): Promise<boolean> {
    if (!robotName.match(regex)) {
      alert("Invalid Robot Name");
      return false;
    }
    let bot: string;
    return fetch(robotMap[robotType])
      .then((data) => {
        if (data.ok) return data.text();
        throw data.statusText;
      })
      .then((code) => {
        bot = robotName + "." + robotType;
        return ow.save(bot, code, false);
      })
      .then(async (result) => {
        console.log(result);
        if ("error" in result) throw result["error"];
        source.set(bot);
        return true;
      })
      .catch((err) => {
        alert(err);
        return false;
      });
  }

  async function updateBots() {
    enemyBots = await rumblePublic();
    for (let i = 0; i < enemyBots.length; i++) {
      let bot = enemyBots[i];
      enemyBots[i].url = bot.url + ":" + bot.rewards;
      enemyBots[i].name =
        bot.name + (bot.rewards > 0 ? " (+" + bot.rewards + ")" : "");
    }
    cyanBots = Object.assign([], enemyBots);
    cyanBots.sort(() => 0.5 - Math.random());
    redBots = Object.assign([], enemyBots);
    redBots.sort(() => 0.5 - Math.random());
    if (ow !== undefined) {
      myBots = await ow.list();
    }
    updateSelectList();
  }

  function updateSelectList() {
    filteredCyanBots = cyanBots.filter(
      (item) =>
        item.name.toLowerCase().indexOf(searchCyanBot.toLowerCase()) !== -1
    );
    filteredMyBots = myBots.filter(
      (item) => item.toLowerCase().indexOf(searchCyanBot.toLowerCase()) !== -1
    );
    filteredRedBots = redBots.filter(
      (item) =>
        item.name.toLowerCase().indexOf(searchRedBot.toLowerCase()) !== -1
    );

    if (myBots.length > 0) {
      myBot = filteredMyBots[0];
    } else {
      myBot = filteredCyanBots[0].url;
    }
    enemyBot = filteredRedBots[0].url;
    console.log("updated", myBot, enemyBot);
  }

  let unsubscribeSource = source.subscribe((value) => {
    editing = value != "";
    updateBots();
  });

  function finish(winner: number) {
    msg = "Game over";
    if (winner == -2) {
      image = "ready";
      extra = "";
    } else if (winner == -1) {
      image = "draw";
      extra = "";
    } else if (winner == 0) {
      image = "won";
      extra = "Great Achievement! Share it with your friends!";
    } else {
      image = "lose";
      extra = "";
    }
    status = "Select Opponents";
    ready = false;
    fighting = false;
    battle.stop();
    inspector.set([
      { n: 0, req: "", res: "", state: "" },
      { n: 0, req: "", res: "", state: "" },
    ]);
  }

  function trace() {
    status = "Tracing...";
    fighting = false;
    msg = battle.trace();
  }

  function suspended(msg: string, state0: string, state1: string) {
    status = msg;
    fighting = false;
    inspector.update((info) => {
      info[0].state = state0;
      info[1].state = state1;
      return info;
    });
  }

  function edit() {
    console.log(myBot);
    source.set(myBot);
    battle.stop();
    editing = true;
  }

  let image = ow === undefined ? "splash" : "ready";
  let Images = new AssetsLoader({
    splash: "img/splash.png",
    ready: "img/ready.png",
    lose: "img/lose.png",
    won: "img/won.png",
    draw: "img/draw.png",
  });

  function splash() {
    //console.log("splash")
    let canvas = document.getElementById("arena") as HTMLCanvasElement;
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 500, 500);
    ctx.drawImage(Images.get(image), 0, 0);
  }

  afterUpdate(() => {
    if (!(editing || ready)) splash();
  });

  function selected() {
    console.log("mybot", myBot);
    console.log("enemybot", enemyBot);

    let champ =
      myBots.length == 0
        ? myBot.split(":")[0]
        : ow.namespace + "/default/" + myBot.split(".")[0];

    let champExtra =
      myBots.length == 0 ? parseInt(myBot.split(":")[1]) : $rewards;

    let enemy = enemyBot.split(":")[0];
    let enemyExtra = parseInt(enemyBot.split(":")[1]);

    let urls = [base + champ, base + enemy];

    let canvas = document.getElementById("arena") as HTMLCanvasElement;

    let startAngles = [
      [Math.random() * 360, Math.random() * 360],
      [Math.random() * 360, Math.random() * 360],
    ];

    let startLives = [champExtra, enemyExtra];

    battle.webinit(canvas.getContext("2d"), urls, startAngles, startLives);
    ready = true;
    msg = "May the FAAS be with you!";
    status = "Fighting!";
    fighting = true;
    battle.draw();
    battle.start();
  }

  function toggle() {
    fighting = !fighting;
    if (fighting) {
      status = "Fighting!";
      battle.start();
    } else {
      status = "Suspended...";
      battle.stop();
    }
  }

  onMount(() => {
    let canvas = document.getElementById("arena") as HTMLCanvasElement;
    battle = new BattleWeb(
      parseInt(canvas.getAttribute("width")),
      parseInt(canvas.getAttribute("height")),
      finish,
      suspended
    );
    updateBots();
    Images.loadAll(() => splash());
  });
  onDestroy(unsubscribeSource);
</script>

<main class="wrapper">
  <section class="container">
    <div class="row">
      {#if msg == ""}
        <img
          style="padding-bottom: 20px"
          alt="banner"
          width="500"
          class="center"
          src="img/banner.png"
        />
      {:else}
        <h1>{msg}</h1>
      {/if}
    </div>
    <div class="row"><canvas id="arena" width="500" height="500" /></div>
    {#if $submitting != ""}
      <Submit {ow} />
    {:else if !ready}
      <div class="row">
        <h3>Make Your Choice</h3>
      </div>
      <div class="row">
        <div class="column column-left column-offset">
          <label
            >Filter Yellow Fighters: <input
              bind:value={searchCyanBot}
              on:input={updateSelectList}
            /></label
          >
          <label for="mybot">Yellow Fighter (You)</label>
          <select bind:value={myBot} id="enemy">
            {#if myBots.length == 0}
              {#each filteredCyanBots as enemy}
                <option value={enemy.url}>{enemy.name}</option>
              {/each}
            {:else}
              {#each filteredMyBots as bot}
                <option value={bot}
                  >{bot.split(".")[0]}{$rewards > 0
                    ? " (+" + $rewards + ")"
                    : ""}</option
                >
              {/each}
            {/if}
          </select>
        </div>
        <div class="column column-right">
          <label
            >Filter Red Fighters: <input
              bind:value={searchRedBot}
              on:input={updateSelectList}
            /></label
          >
          <label for="enemy">Red Fighter (Enemy)</label>
          <select bind:value={enemyBot} id="enemy">
            {#each filteredRedBots as enemy}
              <option value={enemy.url}>{enemy.name}</option>
            {/each}
          </select>
        </div>
      </div>
      <div class="row">
        <div class="column column-left column-offset">
          {#if ow === undefined}
            <button id="login" on:click={login}>Login</button>
          {:else}
            <div class="column column-right">
              <button id="edit" on:click={edit} disabled={myBots.length == 0}
                >Edit my Fighter</button
              >
            </div>
          {/if}
        </div>
        <div class="column column-right">
          <button id="done" disabled={!canStartBattle} on:click={selected}
            >Start the Battle</button
          >
        </div>
      </div>
      {#if ow === undefined}
        <div class="row">
          <div class="column column-center column-offset">
            <h4>
              Welcome to
              <b>FAAS Wars</b>
              v{VERSION}.<br />Please check the
              <a href="license.html">License</a>.<br />
            </h4>
          </div>
        </div>
      {:else}
        <div class="row">
          <div class="column column-left column-offset">
            <button id="create" on:click={create}>Create New Fighter</button>
          </div>
          <div class="column column-right">
            <input
              type="text"
              bind:value={robotName}
              placeholder="robot name"
              id="botname"
            />
          </div>
        </div>
        <div class="row">
          <div class="column column-left column-offset">
            <button
              id="submit"
              disabled={myBots.length == 0}
              on:click={() => {
                submitting.set(myBot);
              }}>Submit to FAAS WARS</button
            >
          </div>
          <div class="column column-right">
            <select bind:value={robotType}>
              <option value="js">JavaScript</option>
              <option value="py">Python</option>
              <option value="go">Golang</option>
            </select>
          </div>
        </div>
        <h4>{extra}</h4>
      {/if}
    {:else}
      <div class="row">
        <h3>{status}</h3>
      </div>
      <div class="row">
        <h1>
          <span id="yellow">{battle.robotName(0)}</span> vs
          <span id="red">{battle.robotName(1)}</span>
        </h1>
      </div>
      <div class="row">
        <div class="column column-left column-offset">
          <br />
          <button id="fight" on:click={toggle}>
            {#if fighting}Suspend{:else}Fight!{/if}
          </button>
          <br />
          <button
            on:click={() => {
              ready = false;
              fighting = false;
              battle.terminate();
            }}>Stop</button
          ><br />
          <button id="edit" on:click={edit} disabled={myBots.length == 0}
            >Edit</button
          >
        </div>
        <div class="column column-right">
          <br />
          <label>
            <input type="checkbox" bind:checked={debug} />
            Debug<br />
            <a
              href="https://apigcp.nimbella.io/wb/?command=activation+list"
              target="workbench">Logs</a
            >
          </label><br />
        </div>
      </div>
      {#if debug}
        <div class="row">
          <div class="column column-left column-offset">
            <button id="step" on:click={trace}>Trace</button>
          </div>
          <div class="column column-right">
            Trace:&nbsp;
            <label>
              <input type="checkbox" bind:checked={log.eventOn} />
              Events&nbsp;
            </label>
            <label>
              <input type="checkbox" bind:checked={log.requestOn} />
              Requests&nbsp;
            </label>
            <label>
              <input type="checkbox" bind:checked={log.actionOn} />
              Actions&nbsp;
            </label>
            (open console)
          </div>
        </div>
        <div class="row">
          <div class="column column-50 column-offset">
            <b>[Me] {$inspector[0].state}</b><br />
            Request/<b>Response</b>
            #{$inspector[0].n}
            <pre>{$inspector[0].req}<br /><b>{$inspector[0].res}</b>
              </pre>
            <b>[Emeny] {$inspector[1].state}</b><br />
            Request/<b>Response</b>
            #{$inspector[1].n}
            <pre>{$inspector[1].req}<br /><b>{$inspector[1].res}</b>
              </pre>
          </div>
        </div>
      {/if}
    {/if}
  </section>
</main>

<style>
  #arena {
    border: 1px solid grey;
    float: left;
  }

  #yellow {
    color: rgb(211, 211, 25);
  }
  #red {
    color: rgb(211, 19, 19);
  }
</style>
