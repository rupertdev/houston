/**
 * houston/src/worker/task/appstream/index.ts
 * Runs a bunch of appstream tests
 * TODO: Only reports error and warn logs instead of all
 */

import * as fs from 'fs-extra'
import * as path from 'path'

import { Log } from '../../log'
import { WrapperTask } from '../wrapperTask'

export class Appstream extends WrapperTask {
  /**
   * All of the fun tests we should run on the appstream file
   *
   * @var {Task[]}
   */
  public tasks = [
    require('./id').AppstreamId,
    require('./name').AppstreamName,
    require('./license').AppstreamLicense,
    require('./summary').AppstreamSummary,
    require('./description').AppstreamDescription,
    require('./screenshot').AppstreamScreenshot,
    require('./release').AppstreamRelease,
    require('./stripe').AppstreamStripe,
    require('./validate').AppstreamValidate
  ]

  /**
   * Path the appstream file should exist at
   *
   * @return {string}
   */
  public get path () {
    return path.resolve(this.worker.workspace, 'package/usr/share/metainfo', `${this.worker.storage.nameDomain}.appdata.xml`)
  }

  /**
   * All of the error logs that do not have a body
   *
   * @return {Log[]}
   */
  public get errorPartials () {
    return this.logs
      .filter((l) => (l.level === Log.Level.ERROR))
      .filter((l) => (l.body == null))
  }

  /**
   * All of the warn logs that do not have a body
   *
   * @return {Log[]}
   */
  public get warnPartials () {
    return this.logs
      .filter((l) => (l.level === Log.Level.WARN))
      .filter((l) => (l.body == null))
  }

  /**
   * Runs all the appstream tests
   *
   * @async
   * @return {void}
   */
  public async run () {
    const exists = await fs.exists(this.path)
    if (exists === false) {
      throw new Log(Log.Level.ERROR, 'Appstream file does not exist')
    }

    await this.runTasks()

    // All logs that don't have a body get put to a single easy to read log
    if (this.errorPartials.length > 0 || this.warnPartials.length > 0) {
      this.concatLogs()
    }

    // All logs that already have a body should be submitted up the stack
    this.logs
      .filter((l) => (l.body != null))
      .forEach((l) => this.worker.report(l))

    if (this.errorLogs.length > 0) {
      this.worker.stop()
    }

    // Save the appstream information
    this.worker.storage.appstream = await fs.readFile(this.path)
  }

  /**
   * Concats any logs that don't have a body to a markdown template for easier
   * looking to the developer.
   *
   * @return {void}
   */
  protected concatLogs () {
    const topLevel = (this.errorPartials.length > 0)
      ? Log.Level.ERROR
      : Log.Level.WARN

    const template = path.resolve(__dirname, 'index.md')

    const log = Log.template(topLevel, template, {
      errors: this.errorPartials,
      storage: this.worker.storage,
      warnings: this.warnPartials
    })

    this.worker.report(log)
  }
}