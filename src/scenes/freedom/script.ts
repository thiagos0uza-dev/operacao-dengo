import { freedom as T } from '../../content/config'
import { useGame } from '../../game/state/store'
import { ui } from '../../game/state/ui'
import { emit, goTo, reduced, robot, run, say, until, wait } from '../../game/interactions/director'
import { cam } from '../../three/cameraRig'
import { music, sfx } from '../../audio/sound'

const G = () => useGame.getState()
export const OBJ_IDS = T.objects.map((o) => o.id)
const HOME = () => cam.shot([0, 2.8, 6.2], [0, 1.1, 0], 1.2)

export function enterFreedom() {
  return run(async () => {
    music(null)
    cam.look(0)
    emit('free:reset')
    cam.cut([0, 1.4, 2.6], [0, 1.4, 0])
    await HOME()
    robot.set('idle', 'sad')
    await say(T.intro)
    robot.set('idle', 'focused')
    ui.set('free', 'play')
  }, { enter: true })
}

export function destroy(id: string) {
  return run(async () => {
    if (G().flags['free.' + id]) return
    const o = T.objects.find((x) => x.id === id)!
    if (id === 'insta') await insta()
    else {
      emit('free:' + id)
      sfx(id === 'contract' ? 'shred' : id === 'gps' ? 'powerdown' : 'crash')
      if (id === 'contract') emit('confetti', { pos: [-0.6, 1, 0.3], n: 70, spread: 0.5 })
      cam.shake(0.06, 0.3)
      robot.set('thumbs', 'proud')
      robot.quip(o.quip)
      await wait(1200)
    }
    G().flag('free.' + id)
    robot.set('idle', 'happy')
    if (OBJ_IDS.every((k) => G().flags['free.' + k])) await openCage()
  })
}

/* O robô tenta monitorar seguidores... e percebe o absurdo. */
async function insta() {
  const I = T.insta
  robot.set('idle', 'happy')
  await say(I.before)
  robot.set('type', 'focused')
  ui.set('insta', { step: 'scan', n: 0 })
  emit('free:insta-on')
  for (let i = 1; i <= I.scan.length; i++) {
    sfx('blip')
    ui.set('insta', { step: 'scan', n: i })
    await wait(reduced() ? 300 : 900)
  }
  robot.set('look', 'confused')
  await say(I.realize)
  ui.set('insta', { step: 'switch', n: I.scan.length })
  await until('insta:off')
  ui.set('insta', null)
  // desligamento DRAMÁTICO
  robot.set('panic', 'panic')
  sfx('alarm')
  emit('free:insta')
  for (let i = 0; i < 3; i++) {
    emit('sparks', { pos: [0.7, 1.3, -0.3], n: 50, spread: 0.7 })
    cam.shake(0.15, 0.4)
    sfx('crash')
    await wait(450)
  }
  sfx('powerdown')
  emit('confetti', { pos: [0.7, 1.5, -0.3], n: 90 })
  robot.set('bow', 'proud')
  await wait(800)
  await say(I.after)
}

async function openCage() {
  ui.set('free', null)
  robot.set('look', 'love')
  await wait(500)
  sfx('powerup')
  emit('free:open')
  cam.shot([0, 4.5, 9], [0, 2.5, 0], reduced() ? 0.5 : 4, 'power2.inOut')
  await wait(reduced() ? 900 : 2600)
  music('finale')
  emit('sparks', { pos: [0, 2, 0], n: 120, spread: 1.5 })
  await wait(reduced() ? 500 : 1800)
  ui.set('messages', 0)
  for (let i = 0; i < T.messages.length; i++) {
    ui.set('messages', i)
    await until('free:next')
  }
  ui.set('messages', null)
  G().flag('free.done')
  goTo('operations')
}
