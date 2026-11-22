import { simulator as T, type SimChoice } from '../../content/config'
import { useGame } from '../../game/state/store'
import { ui } from '../../game/state/ui'
import { emit, goTo, nextChapter, reduced, registerItem, robot, run, say, wait } from '../../game/interactions/director'
import { cam } from '../../three/cameraRig'
import { music, sfx } from '../../audio/sound'

const G = () => useGame.getState()
export const SIM_FLAGS = ['sim.s1', 'sim.s3', 'sim.s4']
export const HOME = () => cam.shot([0, 2.3, 6.4], [0, 1.4, 0], 1.2)

export function enterSim() {
  return run(async () => {
    music('ambient')
    cam.look(0)
    cam.cut([0, 5, 12], [0, 1.4, 0])
    await HOME()
    robot.set('idle', 'focused')
    if (!G().flags['sim.intro']) {
      await say(T.intro)
      G().flag('sim.intro')
    }
    const idx = SIM_FLAGS.findIndex((f) => !G().flags[f])
    ui.set('sim', { idx: idx < 0 ? 2 : idx, stage: 'ask' })
  }, { enter: true })
}

export function choose(idx: number, c: SimChoice) {
  return run(async () => {
    ui.set('sim', { idx, stage: 'react', last: c.id })
    await react(c)
    if (c.reaction === 'report') {
      await say(c.lines.slice(0, 2))
      tearScroll()
      robot.set('idle', 'proud')
      await say(c.lines.slice(2))
    } else await say(c.lines)
    cleanup()
    G().flag(SIM_FLAGS[idx])
    if (idx === 0) registerItem('Pacote de Memes')
    if (idx === 1) registerItem('Passe de Liberdade Infinita')
    robot.set('idle', 'happy')
    HOME()
    ui.set('sim', { idx, stage: 'after', last: c.id })
  })
}

function cleanup() {
  robot.clearProps()
  emit('sim:board', false)
  emit('sim:party', false)
  emit('sim:scroll', 'hide')
}

async function react(c: SimChoice) {
  switch (c.reaction) {
    case 'investigate': {
      robot.props('phone')
      robot.set('nervous', 'nervous')
      ui.set('spam', true)
      for (let i = 0; i < 12; i++) {
        sfx('blip', { rate: 1 + i * 0.05 })
        await wait(reduced() ? 60 : 190)
      }
      ui.set('spam', false)
      robot.drop('phone')
      robot.props('detective', 'magnifier')
      emit('sim:board', true)
      await wait(500)
      sfx('thud')
      cam.shake(0.1, 0.4)
      robot.set('look', 'focused')
      await cam.shot([1.2, 2.2, 4.2], [0.4, 1.9, -1.6], 1)
      break
    }
    case 'achievement':
      sfx('success')
      robot.set('thumbs', 'proud')
      emit('sparks', { pos: [0, 2.2, 0], n: 60 })
      if (c.toast) G().toast('🏆 ' + c.toast, 'success')
      await wait(900)
      break
    case 'meme':
      robot.set('thumbs', 'happy')
      emit('sim:meme')
      sfx('whoosh')
      await wait(1600)
      sfx('pop')
      break
    case 'report':
      robot.set('hold', 'focused')
      emit('sim:scroll', 'unroll')
      sfx('type')
      await wait(1800)
      break
    case 'calls':
      robot.props('phone')
      robot.set('nervous', 'nervous')
      for (let i = 1; i <= 14; i++) {
        ui.set('calls', i)
        sfx('blip', { rate: 0.7 + i * 0.04 })
        await wait(reduced() ? 60 : 160)
      }
      await wait(400)
      ui.set('calls', null)
      break
    case 'party':
      emit('sim:party', true)
      robot.props('partyhat')
      robot.set('dance', 'happy')
      sfx('success')
      emit('confetti', { pos: [0, 3, 0], n: 120 })
      if (c.toast) G().toast('🎉 ' + c.toast, 'success')
      await wait(1600)
      break
  }
}

/** Durante a fala de "rasgar o formulário", picota o papel. */
export function tearScroll() {
  emit('sim:scroll', 'tear')
  sfx('shred')
  emit('confetti', { pos: [0, 2, 0.6], n: 80, spread: 0.6 })
}

/* ---------------------------------------------------------------------- */
/*  Situação 3: dia de dengo (emergência)                                 */
/* ---------------------------------------------------------------------- */
export function startEmergency() {
  return run(async () => {
    ui.set('sim', { idx: 2, stage: 'alarm' })
    emit('sim:alarm', true)
    sfx('alarm')
    robot.set('panic', 'panic')
    await wait(1200)
    robot.props('helmet', 'chocolates', 'firstaid')
    robot.set('idle', 'focused')
    emit('sim:alarm', false)
    ui.set('sim', { idx: 2, stage: 'checklist' })
  })
}

export function shutdown() {
  return run(async () => {
    ui.set('shutdown', 'off')
    sfx('powerdown')
    await wait(2300)
    ui.set('shutdown', 'reboot')
    await wait(1400)
    sfx('powerup')
    ui.set('shutdown', null)
  })
}

export function finishEmergency() {
  return run(async () => {
    ui.set('sim', { idx: 2, stage: 'done' })
    robot.set('hold', 'focused')
    await say(T.emergency.lines)
    G().flag('sim.s4')
    registerItem('Abraço de Emergência')
    robot.clearProps()
    robot.set('wave', 'happy')
    await say(T.outro)
    G().flag('sim.done')
    goTo(nextChapter(G().flags))
  })
}
