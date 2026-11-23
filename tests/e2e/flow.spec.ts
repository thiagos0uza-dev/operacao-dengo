import { test, expect, type Page } from '@playwright/test'

const KEY = 'operacao-dengo-v1'
const errors: string[] = []

function watch(page: Page) {
  errors.length = 0
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error' && !/GL_|WebGL|GPU stall/i.test(m.text())) errors.push(m.text())
  })
}

/** Avança diálogos até o alvo aparecer. */
async function advanceUntil(page: Page, target: string, max = 180) {
  const t = page.locator(target).first()
  for (let i = 0; i < max; i++) {
    if (await t.isVisible().catch(() => false)) return t
    const d = page.getByTestId('dialog')
    if (await d.isVisible().catch(() => false)) await d.click({ timeout: 2000 }).catch(() => {})
    await page.waitForTimeout(250)
  }
  throw new Error('não apareceu: ' + target)
}
const tap = async (page: Page, sel: string) => {
  await (await advanceUntil(page, sel)).dispatchEvent('click')
  await page.waitForTimeout(400) // deixa a interface reagir (humanos não tocam em 5 ms)
}
const hot = (id: string) => `button.hotspot[data-hotspot="${id}"]:not(.dim)`

async function fastMotion(page: Page, extra: Record<string, unknown> = {}) {
  await page.addInitScript(
    ([k, extra]) => {
      if (sessionStorage.getItem('seeded')) return
      sessionStorage.setItem('seeded', '1')
      localStorage.setItem(k as string, JSON.stringify({ state: { settings: { reducedMotion: true, sound: false, volume: 0.5, quality: 'low', dengo: 70, chaos: 15, jokes: 2, speed: 1, clueless: false }, ...(extra as object) }, version: 0 }))
    },
    [KEY, extra],
  )
}

test('experiência completa até o SIM', async ({ page }) => {
  watch(page)
  await fastMotion(page)
  await page.goto('./')
  await page.getByTestId('boot-silent').click()
  await tap(page, '[data-testid=skip-intro]')
  await tap(page, '[data-testid=start]')

  // Central
  await tap(page, hot('computer'))
  await tap(page, '[data-testid=calc]')
  await tap(page, hot('coffee'))
  await tap(page, '[data-testid=ask-dengo]')
  await tap(page, hot('redButton'))
  await tap(page, hot('box'))
  const cup = await advanceUntil(page, '[data-testid=milkmoo-cup]')
  for (let i = 0; i < 16; i++) await cup.click()
  await expect(page.getByText('franquia de Milk Moo')).toBeVisible()
  await page.getByTestId('milkmoo-close').click()
  await tap(page, hot('door'))

  // Simulador
  await tap(page, '[data-testid=choice-life]')
  await tap(page, '[data-testid=sim-next]')
  await tap(page, '[data-testid=choice-report]')
  await tap(page, '[data-testid=sim-again]')
  await tap(page, '[data-testid=choice-enjoy]')
  await tap(page, '[data-testid=sim-next]')
  for (let i = 0; i < 7; i++) {
    await tap(page, `[data-testid=check-${i}]`)
    if (i === 6) await page.waitForTimeout(4200) // desligamento dramático
  }
  await tap(page, '[data-testid=emergency-done]')

  // Liberdade
  for (const id of ['cuffs', 'contract', 'gps']) {
    await tap(page, hot(id))
    await page.waitForTimeout(1500)
  }
  await tap(page, hot('insta'))
  await tap(page, '[data-testid=insta-off]')
  for (let i = 0; i < 4; i++) {
    await tap(page, '[data-testid=free-next]')
    await page.waitForTimeout(1300)
  }

  // Missão final + pedido
  for (let i = 0; i < 7; i++) {
    await tap(page, '[data-testid=proposal-next]')
    await page.waitForTimeout(1300)
  }
  await expect(page.getByTestId('answer-no')).toBeVisible({ timeout: 20000 })
  await tap(page, '[data-testid=answer-yes]')
  await expect(page.locator('.dossier')).toBeVisible({ timeout: 60000 })
  await expect(page.locator('.dossier .status')).toHaveText('NÓS DOIS')
  await page.screenshot({ path: `test-results/final-sim-${test.info().project.name}.png` })
  expect(errors).toEqual([])
})

test('final NÃO é respeitado e funciona', async ({ page }) => {
  watch(page)
  const flags = Object.fromEntries(['intro.done', 'op.welcome', 'op.done', 'sim.done', 'free.done'].map((k) => [k, true]))
  await fastMotion(page, { flags, resumePhase: 'finale' })
  await page.goto('./')
  await page.getByTestId('boot-silent').click()
  for (let i = 0; i < 7; i++) {
    await tap(page, '[data-testid=proposal-next]')
    await page.waitForTimeout(1300)
  }
  const no = await advanceUntil(page, '[data-testid=answer-no]')
  // o robô confisca o botão duas vezes e devolve na terceira; depois o Não funciona
  await expect(page.getByTestId('answer-yes')).toBeEnabled()
  for (let i = 0; i < 12 && !(await page.locator('.no-btn.free').count()); i++) {
    await no.dispatchEvent('pointerdown')
    await page.waitForTimeout(2500)
  }
  await expect(page.locator('.no-btn.free')).toBeVisible({ timeout: 15000 })
  await no.click()
  await expect(page.getByText('Missão encerrada com respeito.').first()).toBeVisible({ timeout: 30000 })
  await expect(page.locator('.friend-card')).toBeVisible({ timeout: 30000 })
  await expect(page.getByTestId('answer-yes')).toHaveCount(0) // não pergunta de novo
  await page.screenshot({ path: `test-results/final-nao-${test.info().project.name}.png` })
  expect(errors).toEqual([])
})

test('HUD: inventário, configurações, som e easter eggs', async ({ page }) => {
  watch(page)
  await fastMotion(page, { flags: { 'intro.done': true, 'op.welcome': true }, resumePhase: 'operations' })
  await page.goto('./')
  await page.getByTestId('boot-sound').click()
  await advanceUntil(page, hot('computer'))
  await page.getByTestId('open-inventory').click()
  await page.getByTestId('inv-milkmoo').click()
  await page.getByTestId('use-milkmoo').click()
  await page.getByTestId('milkmoo-cup').click()
  await page.getByTestId('milkmoo-close').click()
  await page.getByTestId('close-sheet').click()
  await page.getByTestId('toggle-sound').click()
  await page.getByTestId('open-settings').click()
  await expect(page.getByText('Probabilidade de saudade')).toBeVisible()
  await page.getByTestId('close-sheet').click()
  for (let i = 0; i < 3; i++) await page.locator('.hud-logo').click()
  await expect(page.getByText('Recomenda-se consultar uma pessoa apaixonada.')).toBeVisible({ timeout: 15000 })
  expect(errors).toEqual([])
})

test('sem WebGL a história continua em 2D', async ({ page }) => {
  watch(page)
  await fastMotion(page, { flags: { 'intro.done': true, 'op.welcome': true }, resumePhase: 'operations' })
  await page.goto('./?nowebgl')
  await page.getByTestId('boot-silent').click()
  await expect(page.locator('.no-webgl')).toBeVisible()
  await tap(page, '.fallback-actions [data-hotspot=computer]:not([disabled])')
  await tap(page, '[data-testid=calc]')
  await advanceUntil(page, '.fallback-actions [data-hotspot=coffee]:not([disabled])')
  expect(errors).toEqual([])
})
