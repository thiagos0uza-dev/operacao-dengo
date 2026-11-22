import { finale as T } from '../../content/config'
import { useGame } from '../../game/state/store'
import { ui } from '../../game/state/ui'
import { emit, reduced, robot, run, say, until, wait } from '../../game/interactions/director'
import { cam } from '../../three/cameraRig'
import { music, sfx } from '../../audio/sound'

const G = () => useGame.getState()
export const ISLAND: [number, number, number] = [0, 0, 0]
const SKY_SHOT = () => cam.shot([0, 2.2, 7.5], [0, 4.6, -6], reduced() ? 0.5 : 4, 'power2.inOut')

export function enterFinale() {
  return run(async () => {
    music('finale')
    cam.look(0)
    emit('planets', 'apart')
    emit('robot:place', ISLAND)
    cam.cut([0, 6, 16], [0, 1.4, 0])
    await cam.shot([0.4, 1.8, 4.2], [0, 1.5, 0], reduced() ? 0.5 : 3.2)
    robot.set('nervous', 'nervous')
    await wait(600)
    robot.set('look', 'focused')
    await say(T.robot)
    robot.set('fly', 'happy')
    emit('robot:fly')
    sfx('whoosh')
    await wait(900)
    await SKY_SHOT()
    for (let i = 0; i < T.proposal.length; i++) {
      ui.set('proposal', i)
      await until('proposal:next')
    }
    ui.set('proposal', 'question')
  }, { enter: true })
}

/** A resposta dela. Qualquer uma é respeitada e encerra a missão. */
export function answer(a: 'yes' | 'no') {
  sfx(a === 'yes' ? 'heart' : 'click')
  useGame.setState({ answer: a })
  G().flag('finale.done')
  G().setPhase(a)
}

export function enterYes() {
  return run(async () => {
    music('finale')
    cam.look(0)
    emit('robot:away')
    cam.cut([0, 2.2, 7.5], [0, 4.6, -6])
    emit('planets', 'heart')
    sfx('sparkle')
    await wait(reduced() ? 800 : 4200)
    // fogos estilizados
    for (let i = 0; i < 5; i++) {
      emit('sparks', { pos: [(Math.random() - 0.5) * 8, 5 + Math.random() * 3, -6 - Math.random() * 2], n: 70, spread: 1.3 })
      sfx('firework')
      await wait(450)
    }
    emit('confetti', { pos: [0, 3, 1], n: 200, spread: 1.6 })
    emit('hearts', { pos: [0, 6, -2], n: 50 })
    ui.set('yesLine', 0)
    await wait(2600)
    // o robô volta comemorando (mal)
    cam.shot([0.6, 2.2, 5.6], [0, 1.6, 0], 1.6)
    robot.props('partyhat')
    emit('robot:return')
    robot.set('dance', 'love')
    await wait(1600)
    ui.set('yesLine', 1)
    robot.set('spin', 'happy')
    sfx('whoosh')
    await wait(1400)
    robot.set('fall', 'dizzy')
    sfx('thud')
    cam.shake(0.08, 0.3)
    await wait(1600)
    ui.set('yesLine', 2)
    robot.set('dance', 'love')
    emit('confetti', { pos: [0, 2.5, 0.5], n: 120 })
    sfx('pop')
    await wait(2800)
    robot.sign(T.yesEnding.sign)
    robot.set('hold', 'happy')
    await wait(3200)
    ui.set('yesLine', null)
    robot.clearProps()
    robot.set('wave', 'love')
    await cam.shot([0, 2.6, 9], [0, 3.6, -4], 2.5)
    ui.set('dossier', true)
  }, { enter: true })
}

export function enterNo() {
  return run(async () => {
    music('ambient')
    cam.look(0)
    emit('planets', 'calm')
    emit('robot:away')
    cam.cut([0.4, 1.9, 4.6], [0, 1.4, 0])
    robot.props('bowler')
    emit('robot:return')
    robot.set('idle', 'idle')
    await wait(2000)
    robot.drop('bowler')
    robot.props('bowlerHand')
    robot.set('bow', 'idle')
    await wait(1200)
    for (let i = 0; i < T.noEnding.lines.length; i++) {
      ui.set('noLine', i)
      if (i === 1) robot.set('idle', 'happy')
      await wait(reduced() ? 2200 : 3400)
    }
    ui.set('noLine', null)
    robot.set('wave', 'happy')
    ui.set('friend', true)
  }, { enter: true })
}
