import { easterEggs, finale, intro, operations as T } from '../../content/config'
import { useGame, opInvestigations } from '../../game/state/store'
import { ui } from '../../game/state/ui'
import { ask, emit, goTo, moveRobot, nextChapter, reduced, registerItem, robot, run, say, until, wait } from '../../game/interactions/director'
import { cam } from '../../three/cameraRig'
import { music, sfx } from '../../audio/sound'

const G = () => useGame.getState()

/* Posições na sala */
export const SPOT = { hub: [0.1, 0, 0.9] as [number, number, number], desk: [-1.37, 0, -0.01] as [number, number, number] }
export const SHOT = {
  hub: () => cam.shot([0, 2.7, 7.6], [0, 1.2, 0], 1.6),
  desk: () => cam.shot([-0.4, 2.0, 2.4], [-1.6, 1.3, -0.6], 1.2),
}

/* ---------------------------------------------------------------------- */
/*  Abertura                                                              */
/* ---------------------------------------------------------------------- */
export function playIntro(skip = false) {
  return run(async () => {
    music(null)
    if (skip) return showTitle()
    // 1. a estação vista de fora
    emit('stage', 'exterior')
    cam.cut([0, 1.5, 28], [0, 0, 0])
    cam.shot([0.6, 0.4, 6.5], [0, 0, 0], 6, 'power1.inOut')
    ui.set('caption', 'Algum lugar do universo. 03:12, horário da estação.')
    await wait(5200)
    ui.set('caption', null)
    ui.set('flash', Date.now())
    await wait(250)
    // 2. dentro: o robô trabalhando
    emit('stage', 'interior')
    emit('lights', 'dark')
    emit('robot:place', { pos: SPOT.desk, rotY: Math.PI + 0.35 })
    emit('mug:reset')
    robot.set('type', 'focused')
    cam.cut([1.6, 2.2, 3.4], [-1.5, 1.3, -0.6])
    cam.shot([0.6, 2.0, 2.6], [-1.6, 1.3, -0.6], 3)
    for (let i = 0; i < 12; i++) {
      sfx('type', { rate: 0.8 + Math.random() * 0.5 })
      await wait(180)
    }
    // 3. ALERTA
    useGame.setState({ alarm: true })
    emit('lights', 'alarm')
    robot.set('panic', 'panic')
    cam.shot([0, 2.6, 6], [-0.8, 1.2, 0], 0.8)
    for (let i = 0; i < intro.alerts.length; i++) {
      if (i % 3 === 0) sfx('alarm')
      G().toast(intro.alerts[i], 'alert')
      if (i === 2) {
        emit('mug:fall')
        setTimeout(() => sfx('clink'), 600)
        cam.shake(0.12, 0.6)
      }
      await wait(reduced() ? 450 : 750)
    }
    // 4. silêncio. Ele olha pra você.
    useGame.setState({ alarm: false })
    emit('lights', 'dark')
    robot.set('idle', 'nervous')
    await wait(900)
    emit('robot:place', { pos: SPOT.desk, rotY: Math.PI + 0.35 })
    await moveRobot(SPOT.desk, 0.15, 0.8)
    robot.set('look', 'nervous')
    await cam.shot([-1.2, 1.9, 2.0], [-1.37, 1.65, 0], 1.4)
    await say(intro.lookLines)
    await showTitle()
  }, { enter: true })
}

async function showTitle() {
  emit('stage', 'interior')
  emit('lights', 'dark')
  emit('mug:fallen')
  emit('robot:place', { pos: SPOT.desk, rotY: 0.15 })
  robot.set('look', 'focused')
  cam.shot([-0.6, 2.2, 3.6], [-1.2, 1.4, 0], 1)
  ui.set('title', true)
}

export async function startInvestigation() {
  ui.set('title', false)
  sfx('powerup')
  G().flag('intro.done')
  G().setPhase('operations')
}

/* ---------------------------------------------------------------------- */
/*  Central                                                               */
/* ---------------------------------------------------------------------- */
export function enterHub() {
  return run(async () => {
    const f = G().flags
    emit('stage', 'interior')
    emit('lights', f['op.button'] ? 'love' : 'normal')
    emit('mug:fallen')
    emit('robot:place', { pos: SPOT.hub, rotY: 0 })
    music('ambient')
    cam.look(G().isTouch ? 0.75 : 0.35)
    await SHOT.hub()
    if (f['free.done'] && !f['finale.done']) return finaleTeaser()
    if (!f['op.welcome']) {
      robot.set('wave', 'happy')
      await say(T.welcome)
      G().flag('op.welcome')
      robot.set('idle', 'idle')
      if (G().isTouch) ui.set('dragHint', true)
    }
  }, { enter: true })
}

const back = async () => {
  robot.set('idle', 'idle')
  robot.clearProps()
  await moveRobot(SPOT.hub, 0, 0.8)
  SHOT.hub()
}

export const actComputer = () =>
  run(async () => {
    await moveRobot(SPOT.desk, Math.PI + 0.35, 0.8)
    robot.set('type', 'focused')
    SHOT.desk()
    sfx('open')
    ui.set('analysis', 'stats')
    await until('analysis:calc')
    ui.set('analysis', 'calc')
    for (let i = 0; i < 8; i++) {
      sfx('type')
      await wait(170)
    }
    robot.set('panic', 'panic')
    ui.set('analysis', null)
    emit('computer:explode')
    emit('confetti', { pos: [-1.8, 1.5, -0.8], n: 140 })
    sfx('pop')
    sfx('error')
    cam.shake(0.15, 0.5)
    ui.set('error404', true)
    await wait(2000)
    ui.set('error404', false)
    robot.set('idle', 'confused')
    await moveRobot(SPOT.desk, 0.2, 0.5)
    await say(T.computer.after)
    G().flag('op.computer')
    registerItem('Memória RAM Emocional')
    await back()
  })

export const actCoffee = () =>
  run(async () => {
    await moveRobot([-2.7, 0, 1.0], -0.5, 0.8)
    cam.shot([-1.2, 2.3, 4.6], [-3, 1.1, 0.3], 1.2)
    const f = G().flags
    const choice = await ask(T.coffee.question, [
      { id: 'dengo', label: T.coffee.optionDengo + (f['op.coffee.dengo'] ? ' (de novo)' : '') },
      { id: 'space', label: T.coffee.optionSpace + (f['op.coffee.space'] ? ' (de novo)' : '') },
    ])
    if (choice === 'dengo') {
      if (!f['op.coffee.dengo']) {
        robot.set('run', 'panic')
        sfx('whoosh')
        await moveRobot([7, 0, 2.5], -Math.PI / 2, 0.7)
        await wait(500)
        emit('coffee:carry')
        robot.set('carry', 'proud')
        await moveRobot([-1.4, 0, 2.2], -Math.PI / 2 + 0.6, 2.2)
        robot.set('carry', 'panic')
        await say(T.coffee.dengo.slice(0, 2))
        emit('coffee:drop')
        robot.set('idle', 'love')
        emit('hearts', { pos: [-2, 3, 1.5], n: 30 })
        await wait(1200)
        await say(T.coffee.dengo.slice(2))
        G().flag('op.coffee.dengo')
        registerItem('+1 Dengo')
      } else {
        robot.set('idle', 'love')
        emit('hearts', { pos: [-2, 3, 1.5], n: 30 })
        await say('Dengo reaplicado. Sem limite de uso. Sem taxa de serviço.', 'love')
      }
    } else {
      if (!f['op.coffee.space']) {
        robot.props('planet')
        robot.set('hold', 'focused')
        await say(T.coffee.space.slice(0, 1))
        robot.drop('planet')
        emit('coffee:space')
        sfx('sparkle')
        robot.set('idle', 'happy')
        cam.shot([0, 2.2, 7.5], [0, 2.4, -1], 1.4)
        await wait(1600)
        await say(T.coffee.space.slice(1))
        G().flag('op.coffee.space')
        registerItem('Direito de Ficar Quietinha')
      } else {
        robot.set('idle', 'happy')
        await say('Mais espaço concedido. Pode ficar com a galáxia inteira se quiser.', 'happy')
      }
    }
    G().flag('op.coffee')
    await back()
  })

export const actButton = () =>
  run(async () => {
    const again = G().flags['op.button']
    emit('button:press')
    sfx('click')
    if (again) {
      robot.set('panic', 'panic')
      robot.quip('DE NOVO?!')
      emit('hearts', { pos: [0, 4, 0], n: 40 })
      await wait(1400)
      robot.set('idle', 'sad')
      return
    }
    robot.set('panic', 'panic')
    useGame.setState({ alarm: true })
    emit('lights', 'alarm')
    sfx('alarm')
    cam.shot([0, 4.5, 9], [0, 1, 0], 0.6)
    emit('robot:circle')
    ui.set('chaosBanner', true)
    for (let i = 0; i < 4; i++) {
      emit('hop')
      cam.shake(0.18, 0.5)
      if (i % 2) sfx('alarm')
      await wait(700)
    }
    useGame.setState({ alarm: false })
    ui.set('chaosBanner', false)
    emit('lights', 'love')
    emit('hearts', { pos: [0, 4, 0], n: 70 })
    sfx('heart')
    robot.sign(T.redButton.sign)
    robot.set('hold', 'sad')
    await moveRobot([2.4, 0, 1.4], -0.4, 0.8)
    await cam.shot([1.6, 2.0, 4.6], [2.4, 1.5, 1.2], 1)
    await wait(900)
    await say(T.redButton.after)
    G().flag('op.button')
    registerItem('Dengo Premium')
    await back()
  })

export const actBox = () =>
  run(async () => {
    if (G().flags['op.box']) {
      ui.set('milkmoo', true)
      return
    }
    await moveRobot([1.2, 0, 1.8], 0.6, 0.6)
    cam.shot([2.2, 2.2, 4.8], [1.9, 0.8, 0.9], 1)
    emit('box:open')
    robot.set('look', 'confused')
    await wait(reduced() ? 1200 : 4300)
    sfx('success')
    emit('sparks', { pos: [1.9, 1.4, 0.9], n: 60, spread: 0.8 })
    robot.set('dance', 'love')
    await say(T.box.lines)
    G().flag('op.box')
    registerItem('Milk Moo Infinito (LENDÁRIO)')
    ui.set('milkmoo', true)
    await until('milkmoo:close')
    await back()
  })

export const actDoor = () =>
  run(async () => {
    const f = G().flags
    if (opInvestigations(f) < 3 && !f['op.done']) {
      robot.set('idle', 'proud')
      await say(T.doorLocked)
      return
    }
    robot.set('wave', 'focused')
    await say(T.doorOpen)
    emit('door:open')
    sfx('open')
    await cam.shot([3.2, 1.8, 0.4], [4.6, 1.4, -2.8], 1.2)
    G().flag('op.done')
    goTo(nextChapter(G().flags))
  })

/* ---------------------------------------------------------------------- */
/*  Easter eggs da Central                                                */
/* ---------------------------------------------------------------------- */
let posterTaps = 0
export function actPoster() {
  if (G().busy) return
  posterTaps = Math.min(3, posterTaps + 1)
  ui.set('poster', posterTaps)
  sfx(posterTaps < 3 ? 'boop' : 'thud')
  if (posterTaps === 3) robot.quip(easterEggs.secretRoom.found[0].text)
}
export function actHatch() {
  sfx('open')
  music('secret')
  ui.set('secret', true)
}
export function closeSecret() {
  ui.set('secret', false)
  music('ambient')
}

let planetTaps = 0
export function actPlanets() {
  if (G().chaos) return
  planetTaps++
  sfx('boop', { rate: 1.4 })
  if (planetTaps === 2) robot.quip(easterEggs.planetTap)
  if (planetTaps >= 3) {
    planetTaps = 0
    chaosMode()
  }
}

export function chaosMode() {
  if (G().chaos) return
  useGame.setState({ chaos: true })
  sfx('powerdown')
  robot.quip(easterEggs.chaos.on[0].text)
  robot.mood('dizzy')
  const id = G().runId
  setTimeout(() => {
    if (G().runId !== id) return
    useGame.setState({ chaos: false })
    sfx('thud')
    robot.quip(easterEggs.chaos.off[0].text)
    robot.mood('sad')
  }, 9000)
}

export function actMilkMoo() {
  robot.quip(easterEggs.milkMooHub)
  sfx('squeak')
}

/* ---------------------------------------------------------------------- */
/*  Teaser da missão final                                               */
/* ---------------------------------------------------------------------- */
async function finaleTeaser() {
  cam.look(0)
  sfx('success')
  ui.set('finalNotice', true)
  robot.set('nervous', 'panic')
  await wait(1800)
  ui.set('finalNotice', false)
  await say(finale.nervous)
  emit('lights', 'soft')
  music('finale')
  ui.set('fade', true)
  await cam.shot([0, 6, 22], [0, 2, 0], reduced() ? 0.5 : 3.2, 'power2.in')
  G().setPhase('finale')
}
