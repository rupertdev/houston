/**
 * houston/src/worker/task/appstream/id.ts
 * Tests the appstream ID matches correctly
 */

import * as cheerio from 'cheerio'
import * as fs from 'fs-extra'
import * as path from 'path'

import { Log } from '../../log'
import { Task } from '../task'

export class AppstreamId extends Task {

  /**
   * Path the appstream file should exist at
   *
   * @return {string}
   */
  public get path () {
    return path.resolve(this.worker.workspace, 'package/usr/share/metainfo', `${this.worker.storage.nameDomain}.appdata.xml`)
  }

  /**
   * Runs all the appstream tests
   *
   * @async
   * @return {void}
   */
  public async run () {
    const raw = await fs.readFile(this.path)
    const $ = cheerio.load(raw, { xmlMode: true })

    const id = $('component > id')

    if (id.length === 0) {
      $('component').prepend(`<id>${this.worker.storage.nameAppstream}`)
      await fs.writeFile(this.path, $.xml())

      throw new Log(Log.Level.WARN, 'Missing "id" field')
    } else if (id.text() !== this.worker.storage.nameAppstream) {
      id.text(this.worker.storage.nameAppstream)
      await fs.writeFile(this.path, $.xml())

      throw new Log(Log.Level.WARN, `"id" field should be "${this.worker.storage.nameAppstream}"`)
    }
  }
}