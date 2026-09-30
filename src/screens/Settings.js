import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, Typography, Switch, Slider } from '@mui/material'
import { FaMoon, FaSun, FaLeaf, FaHeart } from 'react-icons/fa'
import { motion } from 'framer-motion'

import { colors, typography } from '../styles'
import { supabase } from '../lib/supabase'

const Settings = () => {
  const [session, setSession] = useState(null)
  const [themeMode, setThemeMode] = useState('light')
  const [fontSize, setFontSize] = useState('medium')
  const [notifications, setNotifications] = useState(true)
  const [privacyMode, setPrivacyMode] = useState(false)
  const [hideIntimacy, setHideIntimacy] = useState(false)

  // Initialize session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [])

  // Load user settings from Supabase on session establishment
  useEffect(() => {
    if (!session?.user?.id) return

    ;(async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!error && data) {
        setThemeMode(data.theme_preference || 'light')
        setFontSize(data.font_size || 'medium')
        setNotifications(true) // Default, could be stored separately
        setPrivacyMode(data.privacy_mode || false)
        setHideIntimacy(data.hide_intimacy || false)
      }
    })()
  }, [session?.user?.id])

  // Save user settings to Supabase
  const saveSettings = async () => {
    if (!session?.user?.id) return

    try {
      const { error } = await supabase.from('user_settings').upsert({
        user_id: session.user.id,
        theme_preference: themeMode,
        font_size: fontSize,
        privacy_mode: privacyMode,
        hide_intimacy: hideIntimacy,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error
      console.log('Settings saved to Supabase!')
    } catch (err) {
      console.error('Error saving settings:', err)
    }
  }

  const handleThemeChange = (value) => {
    setThemeMode(value)
    // Apply to document
    if (value === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else if (value === 'light') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', 'system')
    }
  }

  const handleFontSizeChange = (value) => {
    setFontSize(value)
    // Apply font size
    const fontMap = { small: '12px', medium: '14px', large: '16px' }
    document.documentElement.style.fontSize = fontMap[value] || '14px'
  }

  const handleNotificationsChange = (e) => {
    setNotifications(e.target.checked)
    // Could save to Supabase too
  }

  const handlePrivacyMode = (e) => {
    setPrivacyMode(e.target.checked)
    saveSettings()
  }

  const handleHideIntimacy = (e) => {
    setHideIntimacy(e.target.checked)
    saveSettings()
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.background, color: colors.onyx }}>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={{ type: "spring", stiffness: 150 }}
      >
        <Card style={{
          margin: '24px',
          borderRadius: '20px',
          ...colors.shadows.soft,
        }}>
          <CardHeader>
            <Typography variant="h5" style={{ color: colors.onyx }}>
              {t('settings')}
            </Typography>
          </CardHeader>
          <CardContent>

            {/* Theme Mode */}
            <div style={{ mb: '20px' }}>
              <Typography variant="h6" style={{ color: colors.onyx, marginBottom: '8px' }}>
                {t('appearance')}
              </Typography>
              {themeOptions.map((option) => (
                <motion.div
                  key={option.key}
                  whileHover={{ scale: 1.02 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '12px',
                    background: themeMode === option.key ? colors.primary + '20' : colors.surface,
                    border: `1px solid ${themeMode === option.key ? colors.primary : colors.muted}`,
                    marginBottom: '6px',
                    cursor: 'pointer',
                    transition: colors.transitions.fast,
                  }}
                  onClick={() => { handleThemeChange(option.key); saveSettings() }}
                >
                  <span style={{ color: themeMode === option.key ? colors.primary : colors.muted }}>
                    {t(option.label)}
                  </span>
                  <span style={{ color: colors.muted, fontSize: typography.size.xs }}>
                    {t(option.description)}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Font Size */}
            <div style={{ mb: '20px' }}>
              <Typography variant="h6" style={{ color: colors.onyx, marginBottom: '8px' }}>
                {t('fontSize')}
              </Typography>
              {fontSizeOptions.map((option) => (
                <motion.div
                  key={option.key}
                  whileHover={{ scale: 1.02 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '12px',
                    background: fontSize === option.key ? colors.primary + '20' : colors.surface,
                    border: `1px solid ${fontSize === option.key ? colors.primary : colors.muted}`,
                    marginBottom: '6px',
                    cursor: 'pointer',
                    transition: colors.transitions.fast,
                  }}
                  onClick={() => { handleFontSizeChange(option.key); saveSettings() }}
                >
                  <span style={{ color: fontSize === option.key ? colors.primary : colors.muted }}>
                    {t(option.label)}
                  </span>
                  <span style={{ color: colors.muted, fontSize: typography.size.xs }}>
                    {t(option.description)}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Notifications */}
            <div style={{ mb: '20px' }}>
              <Typography variant="h6" style={{ color: colors.onyx, marginBottom: '8px' }}>
                {t('notifications')}
              </Typography>
              <motion.div
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Switch
                  checked={notifications}
                  onChange={handleNotificationsChange}
                  style={{ width: 40, height: 20 }}
                >
                  <span style={{ top: 2, left: 2, position: 'absolute', width: 16, height: 16, borderRadius: '50', background: notifications ? colors.primary : colors.muted, transition: colors.transitions.fast }} />
                </Switch>
                <Typography variant="body2" style={{ marginLeft: '12px', color: colors.muted }}>
                  {t('notificationsEnabled')}
                </Typography>
              </motion.div>
            </div>

            {/* Privacy & Intimacy */}
            <div style={{ mb: '20px' }}>
              <Typography variant="h6" style={{ color: colors.onyx, marginBottom: '8px' }}>
                {t('privacy')}
              </Typography>
              <motion.div
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Switch
                  checked={privacyMode}
                  onChange={handlePrivacyMode}
                  style={{ width: 40, height: 20 }}
                >
                  <span style={{ top: 2, left: 2, position: 'absolute', width: 16, height: 16, borderRadius: '50', background: privacyMode ? colors.primary : colors.muted, transition: colors.transitions.fast }} />
                </Switch>
                <Typography variant="body2" style={{ marginLeft: '12px', color: colors.muted }}>
                  {t('privacyModeDesc')}
                </Typography>
              </motion.div>

              {/* Hide Intimacy Section */}
              <motion.div
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Switch
                  checked={hideIntimacy}
                  onChange={handleHideIntimacy}
                  style={{ width: 40, height: 20 }}
                >
                  <span style={{ top: 2, left: 2, position: 'absolute', width: 16, height: 16, borderRadius: '50', background: hideIntimacy ? colors.primary : colors.muted, transition: colors.transitions.fast }} />
                </Switch>
                <Typography variant="body2" style={{ marginLeft: '12px', color: colors.muted }}>
                  {t('hideIntimacySection')}
                </Typography>
              </motion.div>
            </div>

            {/* About & Support */}
            <div style={{ mt: '20px' }}>
              <Typography variant="h6" style={{ color: colors.onyx, marginBottom: '8px' }}>
                {t('about')}
              </Typography>
              <p style={{ color: colors.muted, lineHeight: 1.6 }}>
                {t('appVersion', { version: '1.0.0' })}
              </p>
              <p style={{ color: colors.muted, lineHeight: 1.6 }}>
                {t('contactSupport')}
              </p>
            </div>

            {/* Save Button */}
            <motion.div
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Button
                fullWidth
                variant="contained"
                style={{
                  background: colors.primary,
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  padding: '12px',
                  fontWeight: typography.weight.medium,
                  marginTop: '20px',
                  ...colors.transitions.fast,
                }}
                onClick={() => saveSettings()}
              >
                {t('saveChanges')}
              </Button>
            </motion.div>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// Helper translations - using inline for now
const t = (key, replacements = {}) => {
  const translations = {
    settings: 'Settings',
    appearance: 'Appearance',
    fontSize: 'Font Size',
    smallText: 'Small',
    smallTextDesc: 'Display more content on screen',
    mediumText: 'Medium',
    mediumTextDesc: 'Default text size',
    largeText: 'Large',
    largeTextDesc: 'Easier to read',
    notifications: 'Notifications',
    notificationsEnabled: 'Enable notifications',
    privacy: 'Privacy & Security',
    privacyModeDesc: 'Hide intimacy section from main dashboard',
    hideIntimacySection: 'Hide intimacy features',
    about: 'About',
    appVersion: 'HerCycle v{version}',
    contactSupport: 'Contact support at support@hercycle.com',
    saveChanges: 'Save Changes',
    enablePartner: 'Enable Partner Mode',
    disablePartner: 'Disable Partner Mode',
    partnerModeDesc: 'Share phase and openness with your partner',
    privacyModeDesc: 'Privacy and security settings',
  }
  return translations[key] || key
}

// Theme options
const themeOptions = [
  { key: 'light', label: 'light', description: 'Use light theme for a fresh look' },
  { key: 'dark', label: 'dark', description: 'Use dark theme for comfortable night viewing' },
  { key: 'system', label: 'system', description: 'Follow system setting' },
]

// Font size options
const fontSizeOptions = [
  { key: 'small', label: 'small', description: 'Display more content on screen' },
  { key: 'medium', label: 'medium', description: 'Default text size' },
  { key: 'large', label: 'large', description: 'Easier to read' },
]

export default Settings