import { 
    Modal as RNModal, 
    ModalProps,
    KeyboardAvoidingView,
    View,
    Platform,
    StyleSheet
} from "react-native"
import { useEffect } from "react"

type PROPS = ModalProps & {
    isOpen: boolean
    withInput?: boolean
    children: React.ReactNode
}

export const Modal = ({ isOpen, withInput, children, ...rest }: PROPS) => {
    useEffect(() => {
        console.log('Modal visibility:', isOpen)
    }, [isOpen])

    return (
        <RNModal
            visible={isOpen}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={() => console.log('Modal close requested')}
            {...rest}
        >
            <View style={styles.overlay}>
                <View style={[
                    styles.modalContent, 
                    withInput && styles.withInput
                ]}>
                    {children}
                </View>
            </View>
        </RNModal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 24,
    },
    withInput: {
        paddingBottom: 20
    }
})